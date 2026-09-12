import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  sender: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true, index: true },
  text: { type: String, required: true },
  threadId: { type: String, default: 'general_daily', index: true },
  isForwarded: { type: Boolean, default: false },
  isMediaOmitted: { type: Boolean, default: false },
  isDecision: { type: Boolean, default: false, index: true },
  replyTo: { type: String, default: null },
  tags: [{ type: String }],
  embedding: { type: [Number], default: [] }
});

// Compound indexes for high-speed person and time searches
MessageSchema.index({ sender: 1, timestamp: 1 });

export const Message = mongoose.model('Message', MessageSchema);
