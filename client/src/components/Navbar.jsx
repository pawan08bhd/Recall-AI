import React from 'react';
import { Sparkles, BarChart2 } from 'lucide-react';

export default function Navbar({ stats, onOpenBenchmark }) {
  return (
    <header className="border-b border-slate-800/80 bg-[#0b0f17]/90 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 p-[1px] shadow-sm shadow-emerald-500/20">
            <div className="w-full h-full bg-[#0b0f17] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white font-sans">Recall</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold tracking-wider">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Semantic Search for Group Chats
            </p>
          </div>
        </div>

        {/* Right: Clean Stats & Benchmark Action */}
        <div className="flex items-center gap-3">
          {stats && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-[11px] text-slate-400">
                <strong className="text-slate-200 font-semibold">{stats.totalMessages?.toLocaleString()}</strong> messages indexed
              </span>
            </div>
          )}

          <button
            onClick={onOpenBenchmark}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 hover:text-white text-xs font-medium transition-all duration-150 shadow-sm active:scale-95"
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Benchmarks</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-mono font-semibold">
              100%
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

