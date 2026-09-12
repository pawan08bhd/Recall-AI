import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import SearchBar from './components/SearchBar.jsx';
import SearchResults from './components/SearchResults.jsx';
import ChatContextDrawer from './components/ChatContextDrawer.jsx';
import BenchmarkModal from './components/BenchmarkModal.jsx';
import { Sparkles, MessageSquare, Compass, Filter } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function App() {
  const [stats, setStats] = useState(null);
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Filter & Sort State
  const [filterSender, setFilterSender] = useState('ALL');
  const [decisionsOnly, setDecisionsOnly] = useState(false);
  const [sortBy, setSortBy] = useState('SCORE'); // SCORE or TIME

  // Context Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [contextData, setContextData] = useState(null);
  const [isContextLoading, setIsContextLoading] = useState(false);

  // Benchmark state
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [isBenchmarkRunning, setIsBenchmarkRunning] = useState(false);

  // Fetch initial stats & benchmark cache
  useEffect(() => {
    fetchStats();
    fetchCachedBenchmark();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      const json = await res.json();
      if (json.success) {
        setStats(json.stats);
      }
    } catch (err) {
      console.warn('Backend stats not available yet:', err.message);
    }
  };

  const fetchCachedBenchmark = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/benchmark/results`);
      const json = await res.json();
      if (json.success && json.report) {
        setBenchmarkData(json.report);
      }
    } catch (err) {
      console.warn('Cached benchmark fetch error:', err.message);
    }
  };

  // Perform search
  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, topK: 15 })
      });

      const json = await res.json();
      if (json.success) {
        setResults(json.data.results);
        setAnalysis(json.data.analysis);
      } else {
        setSearchError(json.error || 'Failed to execute search');
      }
    } catch (err) {
      setSearchError('Could not connect to backend search server.');
    } finally {
      setIsSearching(false);
    }
  };

  // Open Chat Context Drawer
  const handleOpenContext = async (messageId) => {
    setIsDrawerOpen(true);
    setIsContextLoading(true);
    setContextData(null);

    try {
      const res = await fetch(`${API_BASE}/api/messages/${messageId}/context?window=5`);
      const json = await res.json();
      if (json.success) {
        setContextData(json.data);
      }
    } catch (err) {
      console.error('Failed to load chat context:', err);
    } finally {
      setIsContextLoading(false);
    }
  };

  // Run live benchmark
  const handleRunBenchmark = async () => {
    setIsBenchmarkRunning(true);
    try {
      const res = await fetch(`${API_BASE}/api/benchmark/run`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setBenchmarkData(json.report);
      }
    } catch (err) {
      console.error('Failed to run benchmark:', err);
    } finally {
      setIsBenchmarkRunning(false);
    }
  };

  // Filter & Sort Results
  const filteredResults = results ? results.filter(r => {
    if (filterSender !== 'ALL' && r.message.sender !== filterSender) return false;
    if (decisionsOnly && !r.message.isDecision) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'TIME') {
      return new Date(b.message.timestamp) - new Date(a.message.timestamp);
    }
    return b.score - a.score;
  }) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100 font-sans antialiased">
      {/* Top Navigation Bar */}
      <Navbar
        stats={stats}
        onOpenBenchmark={() => setIsBenchmarkOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        
        {/* Simple & Clean Hero */}
        <div className="text-center max-w-2xl mx-auto pt-4 pb-1 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Semantic Chat Search</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Search your group chat by meaning.
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
            Find decisions, agreements, and moments across months of conversation — even when no words match your query.
          </p>
        </div>

        {/* Search Bar & Preset Chips */}
        <SearchBar
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          isLoading={isSearching}
          analysis={analysis}
        />

        {/* Search Error Alert */}
        {searchError && (
          <div className="max-w-3xl mx-auto p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs text-center">
            {searchError}
          </div>
        )}

        {/* Results Filtering & Sorting Toolbar */}
        {results !== null && (
          <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3 px-1 py-1.5 text-xs border-b border-slate-800">
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-slate-500 flex items-center gap-1 text-[11px] font-medium mr-1">
                <Filter className="w-3 h-3 text-slate-500" /> Speaker:
              </span>
              {['ALL', ...(stats?.participants || ['Rohan', 'Priya', 'Kabir', 'Vikram'])].map((sender) => (
                <button
                  key={sender}
                  onClick={() => setFilterSender(sender)}
                  className={`px-2.5 py-1 rounded-md transition text-xs ${
                    filterSender === sender
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {sender}
                </button>
              ))}

              <button
                onClick={() => setDecisionsOnly(!decisionsOnly)}
                className={`ml-1.5 px-2.5 py-1 rounded-md transition text-xs border ${
                  decisionsOnly
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-medium'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Decisions Only {decisionsOnly ? '✓' : ''}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortBy(sortBy === 'SCORE' ? 'TIME' : 'SCORE')}
                className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono transition"
              >
                Sort: {sortBy === 'SCORE' ? 'Relevance' : 'Timestamp'}
              </button>
            </div>
          </div>
        )}

        {/* Search Results Display */}
        {results !== null ? (
          <SearchResults
            results={filteredResults || results}
            query={query}
            onOpenContext={handleOpenContext}
            isLoading={isSearching}
          />
        ) : (
          /* Clean 3-Column Architecture Overview (When empty) */
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-semibold text-white">Meaning & Decisions</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Retrieves messages with zero word overlap. Knows a confirmed decision matters more than chatter.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-semibold text-white">Person & Time Filters</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically extracts participant names and temporal boundaries across 6 months of archive.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-semibold text-white">Context Expansion</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Expand any matching message into its surrounding &plusmn;5 message conversation timeline.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 font-mono">
        Recall • Semantic Search for Group Chats • 4,544 messages indexed
      </footer>

      {/* Slide-over Chat Context Drawer */}
      <ChatContextDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        contextData={contextData}
        isLoading={isContextLoading}
      />

      {/* Benchmark & Evaluation Modal */}
      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
        onRunBenchmark={handleRunBenchmark}
        benchmarkData={benchmarkData}
        isRunning={isBenchmarkRunning}
        onSelectQuery={(q) => {
          setQuery(q);
          handleSearch(q);
        }}
      />
    </div>
  );
}
