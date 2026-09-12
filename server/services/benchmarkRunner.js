import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchChat } from './searchEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Runs the full 40-query benchmark suite and calculates accuracy metrics.
 * 
 * Reports:
 * - All 40 queries accuracy (Top-1, Top-5, Top-10, MRR)
 * - Hard 8 zero-word-overlap queries accuracy
 * - The performance GAP between the two sets
 */
export async function runBenchmark(onProgress = null) {
  const benchmarkFile = path.join(__dirname, '../data/benchmark_queries.json');
  if (!fs.existsSync(benchmarkFile)) {
    throw new Error(`Benchmark queries file not found at: ${benchmarkFile}`);
  }

  const queries = JSON.parse(fs.readFileSync(benchmarkFile, 'utf-8'));
  console.log(`[Benchmark] Starting evaluation of ${queries.length} queries...`);

  const results = [];
  let completed = 0;

  for (const q of queries) {
    const searchRes = await searchChat(q.query, { topK: 10 });
    const hits = searchRes.results;
    
    // Find where the ground-truth target message ranked
    const targetId = q.targetId;
    const rankIndex = hits.findIndex(h => h.message.id === targetId);
    const rank = rankIndex !== -1 ? rankIndex + 1 : null; // 1-indexed

    const isTop1 = rank === 1;
    const isTop5 = rank !== null && rank <= 5;
    const isTop10 = rank !== null && rank <= 10;
    const reciprocalRank = rank !== null ? (1 / rank) : 0;

    results.push({
      id: q.id,
      query: q.query,
      category: q.category,
      isZeroWordOverlap: q.isZeroWordOverlap,
      targetId: q.targetId,
      targetMessage: q.targetMessage,
      rank,
      isTop1,
      isTop5,
      isTop10,
      reciprocalRank,
      topHit: hits[0] || null,
      topHitsSnippet: hits.slice(0, 3).map(h => ({
        id: h.message.id,
        sender: h.message.sender,
        text: h.message.text,
        score: h.score
      }))
    });

    completed++;
    if (onProgress) {
      onProgress(completed, queries.length);
    }
  }

  // Compute metrics
  function computeStats(subset) {
    const count = subset.length;
    if (count === 0) return { count: 0, top1: 0, top5: 0, top10: 0, mrr: 0 };

    const top1Count = subset.filter(r => r.isTop1).length;
    const top5Count = subset.filter(r => r.isTop5).length;
    const top10Count = subset.filter(r => r.isTop10).length;
    const mrrSum = subset.reduce((acc, r) => acc + r.reciprocalRank, 0);

    return {
      count,
      top1Count,
      top5Count,
      top10Count,
      top1Accuracy: Math.round((top1Count / count) * 1000) / 10,
      top5Accuracy: Math.round((top5Count / count) * 1000) / 10,
      top10Accuracy: Math.round((top10Count / count) * 1000) / 10,
      mrr: Math.round((mrrSum / count) * 1000) / 1000
    };
  }

  const allMetrics = computeStats(results);
  const hardSubset = results.filter(r => r.isZeroWordOverlap);
  const warmSubset = results.filter(r => !r.isZeroWordOverlap);

  const hardMetrics = computeStats(hardSubset);
  const warmMetrics = computeStats(warmSubset);

  // The actual gap: All 40 vs Hard 8
  const top1Gap = Math.round((allMetrics.top1Accuracy - hardMetrics.top1Accuracy) * 10) / 10;
  const top5Gap = Math.round((allMetrics.top5Accuracy - hardMetrics.top5Accuracy) * 10) / 10;
  const mrrGap = Math.round((allMetrics.mrr - hardMetrics.mrr) * 1000) / 1000;

  const benchmarkReport = {
    evaluatedAt: new Date().toISOString(),
    summary: {
      allQueries: allMetrics,
      hardZeroWordQueries: hardMetrics,
      warmupQueries: warmMetrics,
      gap: {
        top1GapPercent: top1Gap,
        top5GapPercent: top5Gap,
        mrrGap: mrrGap,
        insight: `The Top-1 accuracy gap between all 40 queries (${allMetrics.top1Accuracy}%) and the hard 8 zero-word-overlap queries (${hardMetrics.top1Accuracy}%) is ${top1Gap}%. This reflects the semantic distance when the model has zero lexical anchors to lean on.`
      }
    },
    details: results
  };

  return benchmarkReport;
}
