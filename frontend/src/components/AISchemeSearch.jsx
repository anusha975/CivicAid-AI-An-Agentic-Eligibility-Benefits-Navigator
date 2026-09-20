import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Quote,
  Layers,
  MapPin,
  Building2,
  IndianRupee,
  Cpu
} from 'lucide-react';
import { searchSchemes } from '../services/api';

const SAMPLE_QUERIES = [
  "I am an engineering student from Telangana looking for scholarships.",
  "Small landholding farmer seeking direct income support and crop insurance.",
  "Woman entrepreneur planning to open a tailoring and boutique business.",
  "Urban street vendor needing micro credit without collateral.",
  "BPL family looking for cashless hospitalization and healthcare cover.",
  "Unorganized worker wanting a guaranteed monthly pension for retirement."
];

export default function AISchemeSearch({ citizenProfile, onSelectScheme, onOpenConnector }) {
  const [query, setQuery] = useState('');
  const [useProfile, setUseProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchStats, setSearchStats] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (overrideQuery = null) => {
    const q = (overrideQuery !== null ? overrideQuery : query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    if (overrideQuery !== null) {
      setQuery(overrideQuery);
    }

    try {
      const activeProfile = useProfile && citizenProfile ? citizenProfile : null;
      const data = await searchSchemes(q, activeProfile, 6);
      setSearchResults(data.results || []);
      setSearchStats({
        query: data.query,
        total: data.total_results || 0,
        timestamp: new Date().toLocaleTimeString(),
        isFallback: !!data.is_fallback
      });
    } catch (err) {
      console.error('Search error:', err);
      setError('Unable to perform semantic search. Please check backend connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Cpu className="w-3.5 h-3.5" /> Module 4: Local RAG Knowledge Engine
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              AI Semantic Scheme Search <Sparkles className="w-5 h-5 text-emerald-400" />
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl">
              Ask in natural language. Our zero-hallucination vector retriever queries official government knowledge items and extracts verbatim evidence citations.
            </p>
          </div>

          {citizenProfile && citizenProfile.occupation && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs flex items-center gap-3 shrink-0">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={useProfile}
                  onChange={(e) => setUseProfile(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <span className="font-medium text-xs">
                  Personalize with Citizen Passport
                </span>
              </label>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                {citizenProfile.occupation} • {citizenProfile.state || 'All India'}
              </span>
            </div>
          )}
        </div>

        {/* Search Bar Input */}
        <div className="mt-5 relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. I am an engineering student from Telangana looking for scholarships..."
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-12 pr-32 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition"
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="absolute right-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Retrieving...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Search AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Sample Query Prompts */}
        <div className="mt-3.5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Sample Prompts:
          </span>
          {SAMPLE_QUERIES.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleSearch(sample)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 border border-slate-800 transition whitespace-nowrap"
            >
              "{sample.slice(0, 42)}..."
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          {onOpenConnector && (
            <button
              onClick={onOpenConnector}
              className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-bold border border-rose-700/60 transition shrink-0 cursor-pointer"
            >
              Configure Backend URL
            </button>
          )}
        </div>
      )}

      {/* Results Header / Stats */}
      {searchStats && !loading && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 px-1">
          <div>
            Showing <strong>{searchStats.total}</strong> matches for:{" "}
            <span className="text-emerald-400 italic font-medium">"{searchStats.query}"</span>
          </div>
          <div className="flex items-center gap-2">
            {searchStats.isFallback && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <span>⚡ Local Grounded Cache</span>
                {onOpenConnector && (
                  <button onClick={onOpenConnector} className="underline hover:text-amber-200 cursor-pointer">
                    (Connect Live Backend)
                  </button>
                )}
              </span>
            )}
            <span className="text-[11px] text-slate-500">
              Retrieved at {searchStats.timestamp}
            </span>
          </div>
        </div>
      )}

      {/* Results List */}
      {loading ? (
        <div className="p-16 text-center rounded-2xl glass-panel border border-slate-800 space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-white">Running Multi-Chunk Vector Retrieval</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Decomposing query, calculating sublinear TF-IDF embeddings, ranking metadata, and extracting grounded evidence...
          </p>
        </div>
      ) : searchResults && searchResults.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {searchResults.map((item, idx) => {
            const scheme = item.scheme;
            const scorePct = Math.round(item.relevance_score * 100);
            const level = scheme.level || (scheme.state === 'All India' ? 'Central' : 'State');
            const docs = scheme.required_documents || scheme.documents_required || [];
            const benefit = scheme.benefits || scheme.benefit_amount || 'Financial Assistance';
            const url = scheme.official_source || scheme.official_url || '#';

            return (
              <div
                key={scheme.id || idx}
                className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition duration-200"
              >
                <div className="space-y-3">
                  {/* Top Bar: Category, State, Match Badge */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                        {scheme.category}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-900 text-slate-400 border border-slate-800 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {level} • {scheme.state || 'All India'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      {scorePct}% Match
                    </div>
                  </div>

                  {/* Scheme Title */}
                  <h3 className="text-base md:text-lg font-bold text-white hover:text-emerald-300 transition leading-snug">
                    {scheme.name}
                  </h3>

                  {/* Ministry Subtitle */}
                  <p className="text-[11px] text-slate-400 font-medium">
                    🏛️ {scheme.ministry}
                  </p>

                  {/* Key Benefits Card */}
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/30 text-emerald-300 text-xs font-semibold flex items-start gap-2">
                    <IndianRupee className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </div>

                  {/* Grounded Evidence Box */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Quote className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      Verified Supporting Evidence:
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                      "{item.evidence}"
                    </p>
                  </div>

                  {/* Matched Rules Checklist */}
                  {item.matched_rules && item.matched_rules.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Why this scheme matches:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.matched_rules.map((rule, rIdx) => (
                          <span
                            key={rIdx}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1"
                          >
                            <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                            {rule}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions & Official Source */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      Source: <span className="text-slate-300">{item.source}</span>
                    </span>
                    <span className="font-mono text-slate-500 shrink-0">
                      Verified: {scheme.last_verified || '2026-03-01'}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 italic">
                    "Based on available scheme information. This tool provides informational guidance and does not guarantee eligibility or approval."
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {onSelectScheme && (
                      <button
                        onClick={() => onSelectScheme(scheme)}
                        className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-300 transition text-center cursor-pointer"
                      >
                        Application Copilot →
                      </button>
                    )}
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      Official Portal <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : searchResults && searchResults.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-white font-bold text-sm">No schemes found matching criteria</h4>
          <p className="text-xs text-slate-400">
            Try adjusting query keywords or searching for broader terms like "scholarships", "farming", or "loans".
          </p>
        </div>
      ) : (
        /* Initial Ready State */
        <div className="p-12 text-center rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">Ask Anything About Government Welfare</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Type your circumstances, profession, state, or educational goals above. The RAG engine will retrieve relevant verified schemes with verbatim evidence.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => handleSearch("I am an engineering student from Telangana looking for scholarships.")}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-emerald-400 font-medium transition inline-flex items-center gap-1.5"
            >
              🎓 Student Scholarships <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleSearch("Small farmer seeking direct income support and crop insurance.")}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-emerald-400 font-medium transition inline-flex items-center gap-1.5"
            >
              🌾 Farmer Assistance <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleSearch("Woman entrepreneur wanting collateral-free loan for small business.")}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-emerald-400 font-medium transition inline-flex items-center gap-1.5"
            >
              💼 Women Loans <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
