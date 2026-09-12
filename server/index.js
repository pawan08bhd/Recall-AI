import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import apiRoutes from './routes/api.js';
import { Message } from './models/Message.js';
import { warmupSearchIndex } from './services/searchEngine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chat_search';

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve static client assets in production if built
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  console.log(`[Server] Serving static frontend build from ${clientDist}`);
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

async function startServer() {
  try {
    let mongoConnected = false;
    try {
      console.log(`[Server] Attempting connection to MongoDB at ${MONGO_URI}...`);
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      mongoConnected = true;
      console.log('[Server] Connected to MongoDB.');

      // Check message count
      const dbCount = await Message.countDocuments();
      console.log(`[Server] Database contains ${dbCount} messages.`);

      // If database already has messages, warm up index
      if (dbCount > 0) {
        console.log('[Server] Warming up search index from MongoDB...');
        await warmupSearchIndex();
      } else {
        // Check if precomputed cache exists
        const cachePath = path.join(__dirname, 'data/embeddings_cache.json');
        if (fs.existsSync(cachePath)) {
          console.log('[Server] Seeding MongoDB from precomputed embeddings cache...');
          const cachedData = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
          await Message.insertMany(cachedData, { ordered: false });
          await warmupSearchIndex(cachedData);
        } else {
          console.log('[Server] No messages in DB. Please run "npm run seed" to compute embeddings.');
        }
      }
    } catch (mongoErr) {
      console.warn(`[Server] MongoDB not available (${mongoErr.message}).`);
      console.log('[Server] Falling back to precomputed embeddings cache in memory...');
      const cachePath = path.join(__dirname, 'data/embeddings_cache.json');
      if (fs.existsSync(cachePath)) {
        const cachedData = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
        await warmupSearchIndex(cachedData);
        console.log(`[Server] Loaded ${cachedData.length} messages into in-memory search index.`);
      } else {
        throw new Error(`Neither MongoDB nor embeddings_cache.json is available: ${mongoErr.message}`);
      }
    }

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Group Chat Semantic Search Server running on port ${PORT}`);
      console.log(`   API: http://localhost:${PORT}/api/stats`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('[Server] Startup error:', err);
    process.exit(1);
  }
}

startServer();
