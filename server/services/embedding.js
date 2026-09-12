import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js cache directory
env.allowLocalModels = false;

let pipelinePromise = null;
const MODEL_NAME = process.env.EMBEDDING_MODEL || 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

/**
 * Thread-safe singleton promise to initialize ONNX pipeline once.
 */
export function getEmbeddingPipeline() {
  if (!pipelinePromise) {
    console.log(`[Embedding] Initializing multilingual model: ${MODEL_NAME}...`);
    pipelinePromise = pipeline('feature-extraction', MODEL_NAME, {
      quantized: true,
      progress_callback: (p) => {
        if (p.status === 'progress') {
          process.stdout.write(`\r[Model Download] ${p.file}: ${Math.round(p.progress || 0)}%`);
        } else if (p.status === 'done') {
          process.stdout.write(`\r[Model Download] ${p.file}: Ready\n`);
        }
      }
    }).then(pipe => {
      console.log(`[Embedding] Multilingual model loaded and ready!`);
      return pipe;
    }).catch(err => {
      pipelinePromise = null;
      throw err;
    });
  }
  return pipelinePromise;
}

/**
 * Computes dense embedding for a text string and returns a normalized float array.
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
export async function embedText(text) {
  const pipe = await getEmbeddingPipeline();
  const output = await pipe(text || ' ', { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Computes embeddings for an array of texts in batches.
 * @param {string[]} texts 
 * @param {number} batchSize 
 * @param {(progress: number, total: number) => void} onProgress 
 * @returns {Promise<number[][]>}
 */
export async function embedBatch(texts, batchSize = 32, onProgress = null) {
  const pipe = await getEmbeddingPipeline();
  const results = [];
  const total = texts.length;

  for (let i = 0; i < total; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    for (const text of batch) {
      const output = await pipe(text || ' ', { pooling: 'mean', normalize: true });
      results.push(Array.from(output.data));
    }
    if (onProgress) {
      onProgress(Math.min(i + batchSize, total), total);
    }
  }
  return results;
}

/**
 * Calculates cosine similarity between two normalized vectors.
 * Since vectors are L2-normalized, cosine similarity is simply the dot product.
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number}
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }
  return dot;
}
