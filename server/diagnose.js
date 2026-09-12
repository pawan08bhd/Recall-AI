import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { warmupSearchIndex, searchChat } from './services/searchEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function diagnose() {
  const cachePath = path.join(__dirname, 'data/embeddings_cache.json');
  const cachedMessages = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  await warmupSearchIndex(cachedMessages);

  const testQueries = [
    { id: 'Q_HARD_01', q: 'When did we finalize the mountain vacation?', targetId: 'msg_1846' },
    { id: 'Q_HARD_06', q: 'Who took responsibility for lodging reservation?', targetId: 'msg_1844' }
  ];

  for (const item of testQueries) {
    console.log(`\n==============================================`);
    console.log(`Diagnosing ${item.id}: "${item.q}"`);
    console.log(`Target ID: ${item.targetId}`);
    
    const searchRes = await searchChat(item.q, { topK: 15 });
    searchRes.results.forEach((r, idx) => {
      const isTarget = r.message.id === item.targetId;
      console.log(`${idx + 1}. [${r.message.id}] score=${r.score.toFixed(4)} (sim=${r.baseSimilarity}, decBoost=${r.decisionBoost}, pBoost=${r.personBoost}) ${isTarget ? '<<< TARGET' : ''}`);
      console.log(`   ${r.message.sender}: "${r.message.text}"`);
    });

    const targetIndex = searchRes.results.findIndex(r => r.message.id === item.targetId);
    console.log(`Target in top 15: ${targetIndex !== -1 ? targetIndex + 1 : 'NO'}`);
  }
}

diagnose().catch(console.error);
