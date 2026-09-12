import { embedText, cosineSimilarity } from './services/embedding.js';

async function test() {
  console.log('Testing Multilingual ONNX Embedding...');
  const start = Date.now();
  
  const q = 'When did we finalize the mountain vacation?';
  const target = 'bhai ticket book kar lo ab sab confirmed hai date 14 ko';
  const unrelated = 'RCB vs CSK aaj shaam ko hai kiska support hai';

  const [vecQ, vecTarget, vecUnrelated] = await Promise.all([
    embedText(q),
    embedText(target),
    embedText(unrelated)
  ]);

  console.log(`Vector dimension: ${vecQ.length}`);
  const simTarget = cosineSimilarity(vecQ, vecTarget);
  const simUnrelated = cosineSimilarity(vecQ, vecUnrelated);

  console.log(`Query: "${q}"`);
  console.log(`Target (Hinglish): "${target}" -> Similarity: ${simTarget.toFixed(4)}`);
  console.log(`Unrelated (Cricket): "${unrelated}" -> Similarity: ${simUnrelated.toFixed(4)}`);
  console.log(`Elapsed time: ${Date.now() - start}ms`);

  if (simTarget > simUnrelated) {
    console.log('SUCCESS: Multilingual model successfully connected English mountain vacation query with Hinglish ticket booking message!');
  } else {
    console.log('WARNING: Target similarity was lower than unrelated');
  }
}

test().catch(console.error);
