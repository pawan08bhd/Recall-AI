import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { warmupSearchIndex } from './services/searchEngine.js';
import { runBenchmark } from './services/benchmarkRunner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log('===============================================================');
  console.log('  RUNNING 40-QUERY BENCHMARK (ALL 40 vs HARD 8 GAP EVALUATION) ');
  console.log('===============================================================');

  // Load embeddings cache for fast CLI evaluation without requiring Mongo daemon
  const cachePath = path.join(__dirname, 'data/embeddings_cache.json');
  if (!fs.existsSync(cachePath)) {
    console.error(`Embeddings cache not found at ${cachePath}. Please run "npm run seed" first.`);
    process.exit(1);
  }

  console.log('Loading in-memory index from embeddings cache...');
  const cachedMessages = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  await warmupSearchIndex(cachedMessages);

  console.log('\nRunning evaluation across 40 queries...\n');
  const report = await runBenchmark((done, total) => {
    process.stdout.write(`\r[Evaluation Progress] ${done}/${total} queries evaluated...`);
  });

  console.log('\n\n===============================================================');
  console.log('                    BENCHMARK RESULTS REPORT                   ');
  console.log('===============================================================');

  console.log('\n1. ALL 40 QUERIES:');
  console.table({
    'Total Queries': report.summary.allQueries.count,
    'Top-1 Accuracy': `${report.summary.allQueries.top1Accuracy}% (${report.summary.allQueries.top1Count}/${report.summary.allQueries.count})`,
    'Top-5 Accuracy': `${report.summary.allQueries.top5Accuracy}% (${report.summary.allQueries.top5Count}/${report.summary.allQueries.count})`,
    'Top-10 Accuracy': `${report.summary.allQueries.top10Accuracy}% (${report.summary.allQueries.top10Count}/${report.summary.allQueries.count})`,
    'Mean Reciprocal Rank (MRR)': report.summary.allQueries.mrr
  });

  console.log('\n2. HARD 8 ZERO-WORD-OVERLAP QUERIES (The Core Challenge):');
  console.table({
    'Total Hard Queries': report.summary.hardZeroWordQueries.count,
    'Top-1 Accuracy': `${report.summary.hardZeroWordQueries.top1Accuracy}% (${report.summary.hardZeroWordQueries.top1Count}/${report.summary.hardZeroWordQueries.count})`,
    'Top-5 Accuracy': `${report.summary.hardZeroWordQueries.top5Accuracy}% (${report.summary.hardZeroWordQueries.top5Count}/${report.summary.hardZeroWordQueries.count})`,
    'Top-10 Accuracy': `${report.summary.hardZeroWordQueries.top10Accuracy}% (${report.summary.hardZeroWordQueries.top10Count}/${report.summary.hardZeroWordQueries.count})`,
    'Mean Reciprocal Rank (MRR)': report.summary.hardZeroWordQueries.mrr
  });

  console.log('\n3. WARM-UP 32 QUERIES:');
  console.table({
    'Total Warm-up Queries': report.summary.warmupQueries.count,
    'Top-1 Accuracy': `${report.summary.warmupQueries.top1Accuracy}%`,
    'Top-5 Accuracy': `${report.summary.warmupQueries.top5Accuracy}%`,
    'Mean Reciprocal Rank (MRR)': report.summary.warmupQueries.mrr
  });

  console.log('\n4. THE ACCURACY GAP ANALYSIS:');
  console.log(`- Top-1 Accuracy Gap: ${report.summary.gap.top1GapPercent}%`);
  console.log(`- Top-5 Accuracy Gap: ${report.summary.gap.top5GapPercent}%`);
  console.log(`- MRR Gap: ${report.summary.gap.mrrGap}`);
  console.log(`- Key Takeaway: ${report.summary.gap.insight}`);

  console.log('\n5. HARD 8 QUERY-BY-QUERY BREAKDOWN:');
  const hardRows = report.details
    .filter(d => d.isZeroWordOverlap)
    .map(d => ({
      ID: d.id,
      Query: d.query.length > 35 ? d.query.slice(0, 32) + '...' : d.query,
      'Target ID': d.targetId,
      'Found Rank': d.rank !== null ? `#${d.rank}` : 'Not in Top 10',
      'Target Match Text': d.targetMessage.text.slice(0, 38) + '...'
    }));
  console.table(hardRows);

  // Save report to file for UI or documentation
  const reportPath = path.join(__dirname, 'data/latest_benchmark_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\nDetailed report saved to: ${reportPath}`);
  process.exit(0);
}

run().catch(err => {
  console.error('Benchmark execution error:', err);
  process.exit(1);
});
