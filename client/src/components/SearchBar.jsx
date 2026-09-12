import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Sparkles, User, Calendar, ArrowRight } from 'lucide-react';

const SUGGESTED_PRESETS = [
  { label: 'Mountain Vacation', query: 'When did we finalize the mountain vacation?' },
  { label: 'Rent Deposit', query: 'Which residential tenancy deposit was sent?' },
  { label: 'Farewell Gift', query: 'What item got purchased for Rahul\'s departure?' },
  { label: 'Priya\'s Budget', query: 'How much did Priya recommend budgeting per person?' },
  { label: 'Games Night in May', query: 'What games night was planned in May?' }
];

export default function SearchBar({ query, setQuery, onSearch, isLoading, analysis }) {
  const [localInput, setLocalInput] = useState(query || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalInput(query || '');
  }, [query]);

  // Keyboard shortcut listener (/ or Ctrl+K to focus)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k') || (e.metaKey && e.key === 'k')) && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (localInput.trim()) {
      setQuery(localInput.trim());
      onSearch(localInput.trim());
    }
  };

  const handleSelectPreset = (presetQuery) => {
    setLocalInput(presetQuery);
    setQuery(presetQuery);
    onSearch(presetQuery);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {/* Search Input Container */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all duration-200 shadow-xl">
          <div className="pl-4 pr-2 text-slate-400">
            <Search className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder="Search by meaning... e.g. 'When did we decide on the trip?'"
            className="w-full py-3.5 px-2 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm sm:text-base font-normal"
          />

          {localInput && (
            <button
              type="button"
              onClick={() => {
                setLocalInput('');
                setQuery('');
              }}
              className="p-1.5 mr-1 text-slate-400 hover:text-slate-200 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Shortcut hint */}
          <div className="hidden sm:flex items-center gap-1 mr-2 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-mono">
            <span>/</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !localInput.trim()}
            className="m-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-semibold text-xs sm:text-sm rounded-xl transition-all duration-150 flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Searching</span>
              </>
            ) : (
              <>
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Clean, Subtle Query Intent Tag */}
      {analysis && (
        <div className="flex items-center flex-wrap gap-2 text-xs px-1 text-slate-400">
          <span className="text-[11px] font-mono text-slate-500">Parsed Intent:</span>
          
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            {analysis.intent?.replace('_', ' ')}
          </span>

          {analysis.targetSender && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-sky-300 text-[11px] font-medium border border-slate-700">
              <User className="w-3 h-3 text-sky-400" />
              {analysis.targetSender}
            </span>
          )}

          {analysis.timeRange && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 text-[11px] font-medium border border-slate-700">
              <Calendar className="w-3 h-3 text-amber-400" />
              {analysis.timeRange.label || 'Date Window'}
            </span>
          )}
        </div>
      )}

      {/* Clean Presets List */}
      <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
        <span className="text-[11px] text-slate-500 mr-1">Suggestions:</span>
        {SUGGESTED_PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectPreset(p.query)}
            className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors active:scale-95"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
