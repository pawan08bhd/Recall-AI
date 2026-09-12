import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { Message } from '../models/Message.js';
import { embedBatch } from '../services/embedding.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chat_search';
const corpusPath = path.join(__dirname, 'chat_corpus.json');
const cachePath = path.join(__dirname, 'embeddings_cache.json');

async function seed() {
  console.log('=== SEEDING GROUP CHAT DATABASE & COMPUTING EMBEDDINGS ===');
  
  if (!fs.existsSync(corpusPath)) {
    console.error(`Corpus file not found at ${corpusPath}. Please run "npm run generate" first.`);
    process.exit(1);
  }

  const messages = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'));
  console.log(`Loaded ${messages.length} messages from corpus.`);

  let enrichedMessages = [];

  if (fs.existsSync(cachePath)) {
    console.log(`Found cached embeddings at ${cachePath}! Loading directly...`);
    enrichedMessages = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    console.log(`Loaded ${enrichedMessages.length} pre-embedded messages from cache.`);
  } else {
    console.log(`Computing embeddings for ${messages.length} messages using multilingual ONNX model...`);
    const texts = messages.map(m => m.text);
    const startEmbed = Date.now();

    const embeddings = await embedBatch(texts, 64, (done, total) => {
      const pct = Math.round((done / total) * 100);
      const elapsed = Math.round((Date.now() - startEmbed) / 1000);
      process.stdout.write(`\r[Embedding Progress] ${done}/${total} (${pct}%) - Elapsed: ${elapsed}s`);
    });
    console.log(`\nEmbeddings computed in ${Math.round((Date.now() - startEmbed) / 1000)}s.`);

    enrichedMessages = messages.map((m, idx) => ({
      ...m,
      embedding: embeddings[idx]
    }));

    console.log(`Saving embeddings cache to ${cachePath}...`);
    fs.writeFileSync(cachePath, JSON.stringify(enrichedMessages), 'utf-8');
    console.log('Cache saved successfully.');
  }

  // Connect to MongoDB
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  console.log('Clearing existing messages collection...');
  await Message.deleteMany({});

  console.log(`Inserting ${enrichedMessages.length} messages into MongoDB...`);
  // Insert in chunks of 500
  const CHUNK_SIZE = 500;
  for (let i = 0; i < enrichedMessages.length; i += CHUNK_SIZE) {
    const chunk = enrichedMessages.slice(i, i + CHUNK_SIZE);
    await Message.insertMany(chunk);
    process.stdout.write(`\r[MongoDB Insert] Inserted ${Math.min(i + CHUNK_SIZE, enrichedMessages.length)}/${enrichedMessages.length}`);
  }

  console.log('\nDatabase seeding completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
