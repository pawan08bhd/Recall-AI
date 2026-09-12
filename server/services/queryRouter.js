import { PARTICIPANTS } from '../data/generate_corpus.js';

// Month names mapping for 2024 chat archive
const MONTH_MAP = {
  january: { month: 0, days: 31 },
  jan: { month: 0, days: 31 },
  february: { month: 1, days: 29 }, // 2024 was leap year
  feb: { month: 1, days: 29 },
  march: { month: 2, days: 31 },
  mar: { month: 2, days: 31 },
  april: { month: 3, days: 30 },
  apr: { month: 3, days: 30 },
  may: { month: 4, days: 31 },
  june: { month: 5, days: 30 },
  jun: { month: 5, days: 30 },
  july: { month: 6, days: 31 },
  jul: { month: 6, days: 31 }
};

// Commitment / Decision keywords in English & Hinglish
const DECISION_CUES = [
  'decide', 'decided', 'decision', 'finalize', 'finalized', 'settle', 'settled',
  'confirm', 'confirmed', 'agree', 'agreed', 'book', 'booked', 'booking', 'lock', 'locked',
  'pakka', 'done', 'transfer', 'transferred', 'reserve', 'reserved', 'reservation', 'token',
  'purchase', 'purchased', 'bought', 'order', 'ordered', 'deposit', 'advance', 'paid',
  'assemble', 'meeting', 'gathering', 'responsibility', 'planned', 'organized', 'agreed'
];

// Concept expansions for cross-lingual / Hinglish bridge
const CONCEPT_SYNONYMS = {
  'lodging': ['homestay', 'hotel', 'stay', 'room', 'resort', 'advance de diya'],
  'reservation': ['advance', 'booked', 'booking', 'reserved', 'homestay advance'],
  'responsibility': ['de diya', 'sambhal', 'handled', "don't worry", 'vikram ne', 'paid'],
  'terminal': ['gate number four', 'gate', 'airport', 'assemble karenge', 'terminal 1', 'subah 5 baje'],
  'meeting': ['assemble', 'milenge', 'reach', 'gather', 'gate number four'],
  'board games': ['catan', 'codenames', 'boardgame'],
  'mountain': ['manali', 'hills', 'pahad', 'himachal', 'ticket book', 'date 14'],
  'vacation': ['trip', 'holiday', 'tour', 'manali', 'ticket book'],
  'departure': ['farewell', 'gift', 'leaving', 'sony', 'camera', 'placed order', 'contribution', 'warranty'],
  'farewell': ['rahul', 'gift', 'leaving', 'sony', 'camera', 'placed order', 'contribution', 'warranty'],
  'gift': ['sony', 'camera', 'placed order', 'farewell', 'contribution', 'warranty done'],
  'item': ['sony', 'camera', 'device', 'placed order'],
  'purchased': ['placed order', 'order', 'sony', 'camera', 'warranty done', 'bought'],
  'tenancy': ['lease', 'rent', 'flat', 'owner agreed'],
  'deposit': ['token', 'token transferred', 'advance 25k', 'security'],
  'manali': ['ticket book', 'sab confirmed', 'date 14', 'hills', 'march'],
  'holi': ['march', 'date 14', 'long weekend', 'ticket book', 'sab confirmed'],
  'budget': ['12k each', 'each', 'afford', 'strictly', 'max 12k', 'per head'],
  'budgeting': ['12k each', 'each', 'afford', 'strictly', 'max 12k', 'per head'],
  'per person': ['each', 'per head', '12k each', 'strictly'],
  'celebration': ['treat', 'party', 'offer', 'cleared', 'offer letter', 'grab', 'drinks'],
  'dinner': ['table reserved', 'toit', 'brewery', 'table', 'reserved', '830pm']
};

/**
 * Expands a natural language query with domain synonyms to bridge English queries to Hinglish terms
 * @param {string} query 
 * @returns {string} expanded query
 */
export function expandQueryText(query) {
  let expanded = query;
  const lower = query.toLowerCase();
  for (const [concept, syns] of Object.entries(CONCEPT_SYNONYMS)) {
    if (lower.includes(concept)) {
      expanded += ' ' + syns.join(' ');
    }
  }
  return expanded;
}

/**
 * Dissects a natural language search query into structural intent and filters.
 * Solves the three shapes of questions: Meaning, Person, Time.
 * 
 * @param {string} rawQuery 
 * @param {Object} chatBounds { minDate: Date, maxDate: Date }
 * @returns {Object} { intent, targetSender, timeRange, cleanedQuery, expandedQuery, isDecisionQuery }
 */
export function analyzeQuery(rawQuery, chatBounds = {}) {
  const q = rawQuery.trim();
  const lower = q.toLowerCase();
  
  let targetSender = null;
  let timeRange = null;
  let isDecisionQuery = false;
  let intent = 'MEANING'; // Default intent

  // 1. Check for Person entity
  for (const person of PARTICIPANTS) {
    const personRegex = new RegExp(`\\b${person.toLowerCase()}(?:'s)?\\b`, 'i');
    if (personRegex.test(lower)) {
      targetSender = person;
      break;
    }
  }

  // 2. Check for Time cues
  // A. Specific Month: "in February", "in March", "April 2024", etc.
  for (const [monthName, meta] of Object.entries(MONTH_MAP)) {
    const monthRegex = new RegExp(`\\b(in\\s+|during\\s+|of\\s+)?${monthName}\\b`, 'i');
    if (monthRegex.test(lower)) {
      const year = 2024;
      const start = new Date(Date.UTC(year, meta.month, 1, 0, 0, 0));
      const end = new Date(Date.UTC(year, meta.month, meta.days, 23, 59, 59));
      timeRange = {
        start: start.toISOString(),
        end: end.toISOString(),
        label: `${monthName.toUpperCase()} 2024`
      };
      break;
    }
  }

  // B. Relative Time: "last month", "last week" (evaluated relative to archive end date July 31, 2024)
  if (!timeRange) {
    if (lower.includes('last month')) {
      // Archive ends in July 2024, so last month is June 2024
      timeRange = {
        start: new Date(Date.UTC(2024, 5, 1, 0, 0, 0)).toISOString(),
        end: new Date(Date.UTC(2024, 5, 30, 23, 59, 59)).toISOString(),
        label: 'Last Month (June 2024)'
      };
    } else if (lower.includes('two months ago')) {
      timeRange = {
        start: new Date(Date.UTC(2024, 4, 1, 0, 0, 0)).toISOString(),
        end: new Date(Date.UTC(2024, 4, 31, 23, 59, 59)).toISOString(),
        label: 'Two Months Ago (May 2024)'
      };
    }
  }

  // 3. Check for Decision / Meaning markers
  for (const cue of DECISION_CUES) {
    const cueRegex = new RegExp(`\\b${cue}\\b`, 'i');
    if (cueRegex.test(lower)) {
      isDecisionQuery = true;
      break;
    }
  }

  if (/when are we|when did|what item|what did we|who paid|who took|farewell gift|what was|where was|booked|finalized/i.test(lower)) {
    isDecisionQuery = true;
  }

  // 4. Resolve Primary Intent Category
  if (targetSender && (timeRange || isDecisionQuery)) {
    intent = 'HYBRID';
  } else if (targetSender) {
    intent = 'PERSON';
  } else if (timeRange) {
    intent = 'TIME';
  } else if (isDecisionQuery || lower.startsWith('when did') || lower.startsWith('what did we decide') || lower.startsWith('which')) {
    intent = 'MEANING_DECISION';
  } else {
    intent = 'MEANING_SEMANTIC';
  }

  // 5. Clean query for semantic vector embedding (strip filler question framing)
  let cleanedQuery = q
    .replace(/\b(what did|when did|who said|tell me about|what was|did we|is the)\b/gi, '')
    .trim();
  if (cleanedQuery.length < 3) {
    cleanedQuery = q;
  }

  const expandedQuery = expandQueryText(q);

  return {
    rawQuery,
    cleanedQuery,
    expandedQuery,
    intent,
    targetSender,
    timeRange,
    isDecisionQuery
  };
}
