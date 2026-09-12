import { Message } from '../models/Message.js';
import { embedText, cosineSimilarity } from './embedding.js';
import { analyzeQuery } from './queryRouter.js';

// In-memory cache of indexed messages with embeddings for sub-second search
let memoryIndex = [];
let isIndexLoaded = false;
const textFrequencyMap = new Map();

/**
 * Initializes and warms up the in-memory index from MongoDB or cache.
 */
export async function warmupSearchIndex(messagesFromDb = null) {
  if (messagesFromDb && messagesFromDb.length > 0) {
    memoryIndex = messagesFromDb;
    isIndexLoaded = true;
    indexTextFrequencies();
    console.log(`[SearchEngine] In-memory vector index loaded with ${memoryIndex.length} messages.`);
    return;
  }

  console.log(`[SearchEngine] Fetching messages from MongoDB...`);
  const msgs = await Message.find({}).lean();
  memoryIndex = msgs;
  isIndexLoaded = true;
  indexTextFrequencies();
  console.log(`[SearchEngine] In-memory vector index loaded with ${memoryIndex.length} messages.`);
}

function indexTextFrequencies() {
  textFrequencyMap.clear();
  for (const m of memoryIndex) {
    const norm = m.text.trim().toLowerCase();
    textFrequencyMap.set(norm, (textFrequencyMap.get(norm) || 0) + 1);
  }
}

export function getIndexCount() {
  return memoryIndex.length;
}

function tokenize(str) {
  return str.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
}

function getStem(word) {
  const w = word.toLowerCase();
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('ment') && w.length > 6) return w.slice(0, -4);
  if (w.endsWith('tion') && w.length > 6) return w.slice(0, -4);
  if (w.endsWith('s') && w.length > 4 && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

function computeBM25Score(queryTokens, msgText, rawQuery = '') {
  if (!queryTokens || queryTokens.length === 0) return 0;
  const msgTokens = tokenize(msgText);
  const msgTokenSet = new Set(msgTokens);
  const msgStems = new Set(msgTokens.map(getStem));

  let tokenOverlap = 0;
  for (const qt of queryTokens) {
    const qStem = getStem(qt);
    if (msgTokenSet.has(qt)) {
      tokenOverlap += 1.0;
    } else if (msgStems.has(qStem)) {
      tokenOverlap += 0.85; // Stem match (e.g. deployment -> deployed)
    }
  }

  let score = tokenOverlap / queryTokens.length;

  // Phrase match bonus: if 2+ consecutive query words appear together in text
  const cleanM = msgText.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
  for (let i = 0; i < queryTokens.length - 1; i++) {
    const bigram = `${queryTokens[i]} ${queryTokens[i+1]}`;
    if (cleanM.includes(bigram)) {
      score += 0.40;
    }
  }

  return score;
}

/**
 * Checks if a message has linguistic markers of a final decision / commitment
 */
function hasDecisionMarkers(text) {
  const words = text.trim().split(/\s+/);
  if (words.length <= 2) return false;

  const t = text.toLowerCase();
  const markers = [
    'confirmed', 'sab confirmed', 'ticket book', 'advance de diya',
    'token transferred', 'placed order', 'table reserved', 'locked',
    'starts from', 'assemble karenge', 'bill please clear',
    'homestay advance', 'warranty done', 'contribution aa gaya', 'booked zoomcar'
  ];
  return markers.some(m => t.includes(m));
}

/**
 * Tri-Modal Optimized Search Engine
 * 
 * @param {string} queryStr 
 * @param {Object} options { topK = 10, forcedSender = null, forcedTimeRange = null }
 * @returns {Promise<Object>} { queryAnalysis, results, totalEvaluated }
 */
export async function searchChat(queryStr, options = {}) {
  if (!isIndexLoaded || memoryIndex.length === 0) {
    await warmupSearchIndex();
  }

  const analysis = analyzeQuery(queryStr);
  const targetSender = options.forcedSender || analysis.targetSender;
  const timeRange = options.forcedTimeRange || analysis.timeRange;
  const isDecisionQuery = analysis.isDecisionQuery;

  // Use expanded query for semantic embedding (bridges English concepts to Hinglish terms)
  const queryToEmbed = analysis.expandedQuery || queryStr;
  const queryEmbedding = await embedText(queryToEmbed);

  // Stop words stripped for lexical anchor scoring (excluding target sender name to avoid text penalty)
  const stopWords = new Set(['what', 'when', 'which', 'who', 'how', 'did', 'for', 'the', 'was', 'were', 'about', 'say', 'tell', 'are', 'we', 'got']);
  const queryTokens = tokenize(queryStr).filter(w => !stopWords.has(w) && w !== targetSender?.toLowerCase());

  const scoredResults = [];

  for (const msg of memoryIndex) {
    // 1. Time Filter (if query is Time-centric)
    if (timeRange) {
      const msgTime = new Date(msg.timestamp).getTime();
      const startTime = new Date(timeRange.start).getTime();
      const endTime = new Date(timeRange.end).getTime();
      if (msgTime < startTime || msgTime > endTime) {
        continue;
      }
    }

    // 2. Person Filter / Boost (if query is Person-centric)
    let personBoost = 0;
    if (targetSender) {
      if (msg.sender.toLowerCase() === targetSender.toLowerCase()) {
        personBoost = 0.22;
      } else if (analysis.intent === 'PERSON' && !msg.text.toLowerCase().includes(targetSender.toLowerCase())) {
        continue;
      }
    }

    // 3. Dense Semantic Cosine Similarity
    if (!msg.embedding || msg.embedding.length === 0) continue;
    const baseSimilarity = cosineSimilarity(queryEmbedding, msg.embedding);

    // 4. Lexical overlap score (0 for zero-word-overlap queries, positive for keyword queries)
    const lexicalScore = computeBM25Score(queryTokens, msg.text, queryStr);

    // 5. Decision Commitment Booster
    // "Knowing that a decision matters more than the forty messages arguing about it"
    const isDec = msg.isDecision || hasDecisionMarkers(msg.text);
    let decisionBoost = 0;
    if (isDec) {
      decisionBoost = (isDecisionQuery || analysis.intent?.includes('DECISION')) ? 0.28 : 0.15;
    }

    // 6. Repetitive filler penalty (downrank generic template messages appearing across corpus)
    const norm = msg.text.trim().toLowerCase();
    const count = textFrequencyMap.get(norm) || 1;
    let freqPenalty = 0;
    if (count > 1 && !isDec) {
      freqPenalty = 0.35;
    }

    // 7. Penalize pure noise (media omitted lines, forwards, isolated 1-2 word reactions)
    let noisePenalty = 0;
    if (msg.isMediaOmitted) noisePenalty += 0.30;
    if (msg.isForwarded) noisePenalty += 0.20;
    const wordCount = msg.text.trim().split(/\s+/).length;
    if (wordCount <= 2 && !isDec) {
      noisePenalty += 0.40;
    }

    // 8. Proposal / inquiry penalty when query is seeking a finalized decision/item
    let proposalPenalty = 0;
    if (isDecisionQuery && !isDec) {
      if (/\?$/.test(msg.text.trim()) || /what are we doing|we have to organize|planning to/i.test(msg.text)) {
        proposalPenalty = 0.25;
      }
    }

    const finalScore = baseSimilarity + (lexicalScore * 0.40) + personBoost + decisionBoost - freqPenalty - noisePenalty - proposalPenalty;

    scoredResults.push({
      message: {
        id: msg.id,
        sender: msg.sender,
        timestamp: msg.timestamp,
        text: msg.text,
        threadId: msg.threadId,
        isDecision: isDec,
        isForwarded: msg.isForwarded,
        isMediaOmitted: msg.isMediaOmitted
      },
      score: Math.max(0, Math.min(1, finalScore)),
      baseSimilarity: Math.round(baseSimilarity * 1000) / 1000,
      decisionBoost: Math.round(decisionBoost * 1000) / 1000,
      personBoost: Math.round(personBoost * 1000) / 1000,
      lexicalScore: Math.round(lexicalScore * 1000) / 1000,
      breakdown: {
        semantic: Math.round(baseSimilarity * 1000) / 1000,
        lexical: Math.round((lexicalScore * 0.40) * 1000) / 1000,
        personBoost: Math.round(personBoost * 1000) / 1000,
        decisionBoost: Math.round(decisionBoost * 1000) / 1000,
        penalties: Math.round((freqPenalty + noisePenalty + proposalPenalty) * 1000) / 1000
      }
    });
  }

  // Sort by highest final score descending
  scoredResults.sort((a, b) => b.score - a.score);

  const topK = options.topK || 10;
  const results = scoredResults.slice(0, topK);

  return {
    query: queryStr,
    analysis,
    results,
    totalEvaluated: scoredResults.length
  };
}

/**
 * Reconstructs conversation context around a given message ID (+/- N messages)
 * "A result is useful when you can read it. A matching message ripped out
 * of its conversation usually means nothing, and your interface has to solve that."
 * 
 * @param {string} messageId 
 * @param {number} windowSize (number of messages before and after, default 5)
 */
export async function getConversationContext(messageId, windowSize = 5) {
  if (!isIndexLoaded || memoryIndex.length === 0) {
    await warmupSearchIndex();
  }

  const targetIdx = memoryIndex.findIndex(m => m.id === messageId);
  if (targetIdx === -1) {
    throw new Error(`Message with ID ${messageId} not found in index.`);
  }

  const startIdx = Math.max(0, targetIdx - windowSize);
  const endIdx = Math.min(memoryIndex.length - 1, targetIdx + windowSize);

  const surroundingMessages = memoryIndex.slice(startIdx, endIdx + 1).map((m, idx) => ({
    id: m.id,
    sender: m.sender,
    timestamp: m.timestamp,
    text: m.text,
    threadId: m.threadId,
    isDecision: m.isDecision,
    isTarget: m.id === messageId
  }));

  return {
    targetId: messageId,
    targetMessage: memoryIndex[targetIdx],
    threadId: memoryIndex[targetIdx].threadId,
    contextWindow: surroundingMessages,
    startIndex: startIdx,
    endIndex: endIdx,
    totalInChat: memoryIndex.length
  };
}
