import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchChat, getConversationContext, getIndexCount } from '../services/searchEngine.js';
import { runBenchmark } from '../services/benchmarkRunner.js';
import { analyzeQuery } from '../services/queryRouter.js';
import { Message } from '../models/Message.js';
import { PARTICIPANTS } from '../data/generate_corpus.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cached benchmark result
let lastBenchmarkResult = null;
try {
  const cachedReportPath = path.join(__dirname, '../data/latest_benchmark_report.json');
  if (fs.existsSync(cachedReportPath)) {
    lastBenchmarkResult = JSON.parse(fs.readFileSync(cachedReportPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not load cached benchmark report:', e.message);
}
let isBenchmarkRunning = false;

// GET /api/stats
router.get('/stats', async (req, res) => {
  try {
    const totalCount = getIndexCount();
    const participants = PARTICIPANTS;
    res.json({
      success: true,
      stats: {
        totalMessages: totalCount,
        participants: participants,
        dateRange: {
          start: '2024-02-01',
          end: '2024-08-01'
        },
        embeddingModel: process.env.EMBEDDING_MODEL || 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
        framework: 'MERN + @xenova/transformers (ONNX Runtime)'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/analyze-query
router.post('/analyze-query', (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });
    const analysis = analyzeQuery(query);
    res.json({ success: true, analysis });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/search
router.post('/search', async (req, res) => {
  try {
    const { query, topK = 10, forcedSender, forcedTimeRange } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Valid query string is required' });
    }

    const searchOutput = await searchChat(query, {
      topK: Number(topK) || 10,
      forcedSender,
      forcedTimeRange
    });

    res.json({
      success: true,
      data: searchOutput
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/messages/:id/context
router.get('/messages/:id/context', async (req, res) => {
  try {
    const { id } = req.params;
    const windowSize = parseInt(req.query.window) || 5;

    const context = await getConversationContext(id, windowSize);
    res.json({
      success: true,
      data: context
    });
  } catch (err) {
    console.error('Context error:', err);
    res.status(404).json({ success: false, error: err.message });
  }
});

// GET /api/benchmark/queries
router.get('/benchmark/queries', (req, res) => {
  try {
    const benchmarkFile = path.join(__dirname, '../data/benchmark_queries.json');
    if (!fs.existsSync(benchmarkFile)) {
      return res.status(404).json({ error: 'Benchmark queries not generated yet' });
    }
    const queries = JSON.parse(fs.readFileSync(benchmarkFile, 'utf-8'));
    res.json({ success: true, queries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/benchmark/run
router.post('/benchmark/run', async (req, res) => {
  if (isBenchmarkRunning) {
    return res.status(429).json({ error: 'Benchmark evaluation already in progress' });
  }
  
  try {
    isBenchmarkRunning = true;
    console.log('[API] Running benchmark evaluation...');
    const result = await runBenchmark();
    lastBenchmarkResult = result;
    isBenchmarkRunning = false;
    res.json({ success: true, report: result });
  } catch (err) {
    isBenchmarkRunning = false;
    console.error('Benchmark runner error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/benchmark/results
router.get('/benchmark/results', (req, res) => {
  if (!lastBenchmarkResult) {
    return res.json({ success: true, report: null });
  }
  res.json({ success: true, report: lastBenchmarkResult });
});

export default router;
