import React, { useState } from 'react';
import { MessageSquare, Clock, ArrowUpRight, Sparkles, ChevronDown, ChevronUp, Copy, Check, Award } from 'lucide-react';

const SENDER_AVATARS = {
  Rohan: { ring: 'ring-emerald-500/40', bg: 'bg-emerald-600', text: 'text-white' },
  Priya: { ring: 'ring-rose-500/40', bg: 'bg-rose-600', text: 'text-white' },
  Kabir: { ring: 'ring-amber-500/40', bg: 'bg-amber-600', text: 'text-white' },
  Ananya: { ring: 'ring-pink-500/40', bg: 'bg-pink-600', text: 'text-white' },
  Vikram: { ring: 'ring-blue-500/40', bg: 'bg-blue-600', text: 'text-white' },
  Sneha: { ring: 'ring-purple-500/40', bg: 'bg-purple-600', text: 'text-white' },
  Amit: { ring: 'ring-orange-500/40', bg: 'bg-orange-600', text: 'text-white' },
  Neha: { ring: 'ring-teal-500/40', bg: 'bg-teal-600', text: 'text-white' }
};

function formatTimestamp(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoStr;
  }
}

function checkZeroWordOverlap(query, text) {
  if (!query || !text) return { isZero: false };
  const qWords = new Set(query.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean));
  const tWords = new Set(text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean));
  const overlap = [...qWords].filter(w => tWords.has(w));
  return { isZero: overlap.length === 0 };
}

export default function SearchResults({ results, query, onOpenContext, isLoading }) {
  const [expandedScoreId, setExpandedScoreId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleScoreBreakdown = (id) => {
    setExpandedScoreId(expandedScoreId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto py-16 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-400 font-mono">Searching across 4,544 messages...</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 pb-16">
      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-mono">
        <span>{results.length} results found</span>
        <span>Ranked by Semantic Relevance</span>
      </div>

      <div className="space-y-2.5">
        {results.map((item, idx) => {
          const msg = item.message;
          const avatar = SENDER_AVATARS[msg.sender] || {
            ring: 'ring-slate-500/40',
            bg: 'bg-slate-600',
            text: 'text-white'
          };
          const { isZero } = checkZeroWordOverlap(query, msg.text);
          const scorePercent = Math.round(item.score * 100);
          const isExpanded = expandedScoreId === msg.id;
          const isCopied = copiedId === msg.id;

          return (
            <div
              key={msg.id}
              className={`rounded-xl border transition-all duration-150 overflow-hidden ${
                idx === 0
                  ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
              }`}
            >
              <div className="p-4 space-y-2.5">
                {/* Header row: Sender, Timestamp, Badges */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Rank Badge */}
                    {idx === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-semibold border border-emerald-500/30">
                        <Award className="w-3 h-3" />
                        Top Match
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-slate-500">
                        #{idx + 1}
                      </span>
                    )}

                    {/* Avatar & Name */}
                    <div className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-full ${avatar.bg} ring-1 ${avatar.ring} flex items-center justify-center font-bold text-[10px] ${avatar.text}`}>
                        {msg.sender.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-slate-200">
                        {msg.sender}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500 font-mono">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>

                  {/* Badges Right */}
                  <div className="flex items-center gap-1.5">
                    {isZero && (
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-medium">
                        Zero-Word
                      </span>
                    )}

                    {msg.isDecision && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
                        Decision
                      </span>
                    )}

                    {/* Score toggle */}
                    <button
                      type="button"
                      onClick={() => toggleScoreBreakdown(msg.id)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono transition"
                    >
                      <span>{scorePercent}%</span>
                      {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                    </button>
                  </div>
                </div>

                {/* Message Bubble */}
                <div className="relative group/msg p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-slate-200 text-sm leading-relaxed">
                  <p className="pr-7">{msg.text}</p>
                  
                  <button
                    onClick={() => handleCopy(msg.text, msg.id)}
                    className="absolute right-2.5 top-2.5 p-1 text-slate-500 hover:text-slate-200 opacity-0 group-hover/msg:opacity-100 transition rounded"
                    title="Copy text"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-end pt-0.5">
                  <button
                    onClick={() => onOpenContext(msg.id)}
                    className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition"
                  >
                    <span>View Context</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Expanded Score Matrix */}
                {isExpanded && (
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono space-y-1.5 pt-2">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Score Breakdown</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Dense Cosine:</span>
                        <span className="text-slate-200">{item.baseSimilarity || item.breakdown?.semantic || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Lexical Match:</span>
                        <span className="text-slate-200">{item.breakdown?.lexical || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Decision Boost:</span>
                        <span className="text-emerald-400">+{item.decisionBoost || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Total Score:</span>
                        <span className="text-white font-bold">{item.score?.toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
