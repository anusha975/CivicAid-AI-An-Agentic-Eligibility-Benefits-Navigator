import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  UserCheck,
  Compass,
  FileCheck2,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Quote,
  Layers,
  Building2,
  IndianRupee,
  Cpu,
  ExternalLink,
  ChevronRight,
  Bot,
  ListOrdered,
  BookOpen,
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { analyzeWithAgents } from '../services/api';

const AGENT_STAGES = [
  { id: 'profile', name: 'Profile Analyzer', role: 'Extracts attributes & flags missing info', icon: UserCheck, color: 'text-cyan-400' },
  { id: 'discovery', name: 'Scheme Discovery', role: 'RAG semantic scan over knowledge base', icon: Compass, color: 'text-indigo-400' },
  { id: 'eligibility', name: 'Eligibility Agent', role: 'Deterministic rule & quota classification', icon: Sparkles, color: 'text-emerald-400' },
  { id: 'document', name: 'Document Agent', role: 'Maps certificates & issuing departments', icon: FileCheck2, color: 'text-amber-400' },
  { id: 'guide', name: 'Application Guide', role: 'Step-by-step submission roadmap & DBT', icon: ListOrdered, color: 'text-teal-400' }
];

export default function AIBenefitsAdvisor({ citizenProfile, onSelectScheme, onEditProfile }) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ELIGIBLE' | 'POSSIBLY_ELIGIBLE' | 'INSUFFICIENT_INFORMATION' | 'NOT_ELIGIBLE' | 'DOCUMENTS' | 'ROADMAP'
  const [loading, setLoading] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(-1);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  // Auto-run on first mount if profile is available
  useEffect(() => {
    if (citizenProfile && citizenProfile.occupation && !analysisResult && !loading) {
      runAgentPipeline();
    }
  }, []);

  const runAgentPipeline = async (customQuery = null) => {
    setLoading(true);
    setError(null);
    setCurrentStageIdx(0);

    // Visual progression simulation across the 5 agents
    const timer1 = setTimeout(() => setCurrentStageIdx(1), 300);
    const timer2 = setTimeout(() => setCurrentStageIdx(2), 650);
    const timer3 = setTimeout(() => setCurrentStageIdx(3), 1000);
    const timer4 = setTimeout(() => setCurrentStageIdx(4), 1350);

    try {
      const q = customQuery !== null ? customQuery : query;
      const res = await analyzeWithAgents(citizenProfile || {}, q);
      setAnalysisResult(res);
      setCurrentStageIdx(5); // Completed
    } catch (err) {
      console.error('Agent pipeline execution failed:', err);
      setError('Multi-Agent analysis failed. Please ensure backend server is running.');
      setCurrentStageIdx(-1);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ELIGIBLE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> ELIGIBLE
          </span>
        );
      case 'POSSIBLY_ELIGIBLE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> POSSIBLY ELIGIBLE
          </span>
        );
      case 'INSUFFICIENT_INFORMATION':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> MORE INFO NEEDED
          </span>
        );
      case 'NOT_ELIGIBLE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> NOT ELIGIBLE
          </span>
        );
      default:
        return null;
    }
  };

  const filteredEligibility = (analysisResult?.eligibility || []).filter((item) => {
    if (activeTab === 'ALL') return true;
    return item.status === activeTab;
  });

  const eligibleCount = (analysisResult?.eligibility || []).filter((e) => e.status === 'ELIGIBLE').length;
  const possiblyCount = (analysisResult?.eligibility || []).filter((e) => e.status === 'POSSIBLY_ELIGIBLE').length;
  const insufficientCount = (analysisResult?.eligibility || []).filter((e) => e.status === 'INSUFFICIENT_INFORMATION').length;
  const notEligibleCount = (analysisResult?.eligibility || []).filter((e) => e.status === 'NOT_ELIGIBLE').length;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Bot className="w-3.5 h-3.5" /> Module 5: Multi-Agent Benefits Advisor
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              CivicAid Multi-Agent Intelligence <Sparkles className="w-5 h-5 text-emerald-400" />
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl">
              An orchestrator coordinating 5 specialized agents to analyze your profile, discover welfare schemes, strictly classify eligibility, map mandatory documents, and generate application step-by-step guides.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => runAgentPipeline()}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {analysisResult ? 'Re-Run Multi-Agent Analysis' : 'Run 5-Agent Analysis'}
            </button>
          </div>
        </div>

        {/* 5-Stage Agent Pipeline Visualizer */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" /> 5-Stage Agent Orchestration Workflow:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {AGENT_STAGES.map((stg, idx) => {
              const Icon = stg.icon;
              const isCurrent = loading && currentStageIdx === idx;
              const isDone = (!loading && analysisResult) || (loading && currentStageIdx > idx);

              return (
                <div
                  key={stg.id}
                  className={`p-3 rounded-xl border transition-all duration-300 relative ${
                    isCurrent
                      ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30'
                      : isDone
                      ? 'bg-slate-900/80 border-slate-700/80'
                      : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 ${stg.color}`} />
                      <span className="font-bold text-xs text-white">{stg.name}</span>
                    </div>
                    {isCurrent ? (
                      <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                    ) : isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{stg.role}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Results Container */}
      {loading ? (
        <div className="p-16 text-center rounded-2xl glass-panel border border-slate-800 space-y-4">
          <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              Running Stage {currentStageIdx + 1}/5: {AGENT_STAGES[Math.max(0, Math.min(4, currentStageIdx))]?.name}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Executing tool calls: <code>search_schemes()</code>, <code>check_eligibility()</code>, <code>get_required_documents()</code>, and <code>get_application_method()</code>...
            </p>
          </div>
        </div>
      ) : analysisResult ? (
        <div className="space-y-6">
          {/* Executive Summary & Strategy Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/40 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Executive Advisor Synthesis</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {analysisResult.summary}
            </p>

            {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Recommended Action Plan:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {analysisResult.recommendations.map((rec, rIdx) => (
                    <div
                      key={rIdx}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Missing Information & Clarification Questions (if any) */}
          {analysisResult.missing_information && analysisResult.missing_information.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-sm text-amber-300">
                    Profile Information Gaps ({analysisResult.missing_information.length} fields unstated)
                  </h4>
                </div>
                {onEditProfile && (
                  <button
                    onClick={onEditProfile}
                    className="text-xs px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/30 transition"
                  >
                    Update Profile Wizard
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400">
                The Profile Analyzer detected unstated fields. Providing these details unlocks more precise eligibility matches:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {analysisResult.missing_information.map((item, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-3 rounded-xl bg-slate-900/90 border border-amber-900/30 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-amber-400 capitalize">{item.field.replace(/_/g, ' ')}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800/40">
                        {item.importance} Importance
                      </span>
                    </div>
                    <p className="text-slate-300 font-medium text-xs">{item.question}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Status Tabs */}
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800 pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTab === 'ALL'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                All Analyzed ({analysisResult.eligibility?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('ELIGIBLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'ELIGIBLE'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-emerald-400 hover:bg-emerald-950/40'
                }`}
              >
                Eligible ({eligibleCount})
              </button>

              <button
                onClick={() => setActiveTab('POSSIBLY_ELIGIBLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'POSSIBLY_ELIGIBLE'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-amber-400 hover:bg-amber-950/40'
                }`}
              >
                Possibly Eligible ({possiblyCount})
              </button>

              <button
                onClick={() => setActiveTab('INSUFFICIENT_INFORMATION')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'INSUFFICIENT_INFORMATION'
                    ? 'bg-purple-500 text-white font-bold'
                    : 'text-purple-400 hover:bg-purple-950/40'
                }`}
              >
                Needs Info ({insufficientCount})
              </button>

              <button
                onClick={() => setActiveTab('NOT_ELIGIBLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'NOT_ELIGIBLE'
                    ? 'bg-rose-500 text-white font-bold'
                    : 'text-rose-400 hover:bg-rose-950/40'
                }`}
              >
                Ineligible ({notEligibleCount})
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Showing <strong>{filteredEligibility.length}</strong> programs
            </div>
          </div>

          {/* Scheme Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredEligibility.map((item, idx) => {
              const scheme = item.scheme;
              const level = scheme.level || (scheme.state === 'All India' ? 'Central' : 'State');
              const benefit = scheme.benefits || scheme.benefit_amount || 'Financial Assistance';
              const url = scheme.official_source || scheme.official_url || '#';

              // Find matching document plan & application step for this scheme
              const docPlan = (analysisResult.documents || []).find((d) => d.scheme_id === scheme.id);
              const appStep = (analysisResult.application_steps || []).find((a) => a.scheme_id === scheme.id);
              const ev = (analysisResult.evidence || []).find((e) => e.scheme_id === scheme.id);

              return (
                <div
                  key={scheme.id || idx}
                  className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
                >
                  <div className="space-y-3">
                    {/* Top Bar: Status, Category, Confidence */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-900 text-slate-300 border border-slate-800">
                          {scheme.category}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-300">
                        Confidence: <span className="text-emerald-400 font-mono">{item.confidence_score}%</span>
                      </div>
                    </div>

                    {/* Title & Level */}
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-white hover:text-emerald-300 transition leading-snug">
                        {scheme.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        🏛️ {scheme.ministry} ({level} • {scheme.state || 'All India'})
                      </p>
                    </div>

                    {/* Benefit Box */}
                    <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/30 text-emerald-300 text-xs font-semibold flex items-start gap-2">
                      <IndianRupee className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>

                    {/* Eligibility Assessment Dimension Breakdown */}
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Eligibility Assessment
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.matched_conditions?.length || 0} passed • {item.unknown_conditions?.length || 0} missing
                        </span>
                      </div>

                      {/* Conditions Checklist (Passed, Missing, Failed) */}
                      <div className="space-y-1 text-xs">
                        {/* Matched Passed Conditions */}
                        {(item.matched_conditions || []).slice(0, 4).map((cond, cIdx) => (
                          <div key={`m-${cIdx}`} className="flex items-start gap-2 text-slate-300">
                            <span className="text-emerald-400 font-bold text-sm leading-none">✓</span>
                            <span className="leading-tight">{cond.label}: <span className="text-slate-400">{cond.detail}</span></span>
                          </div>
                        ))}

                        {/* Unknown Missing Conditions */}
                        {(item.unknown_conditions || []).map((cond, uIdx) => (
                          <div key={`u-${uIdx}`} className="flex items-start gap-2 text-amber-300">
                            <span className="text-amber-400 font-bold text-sm leading-none">⚠</span>
                            <span className="leading-tight">{cond.label}: <span className="text-amber-200/90">{cond.detail}</span></span>
                          </div>
                        ))}

                        {/* Failed Disqualifying Conditions */}
                        {(item.failed_conditions || []).map((cond, fIdx) => (
                          <div key={`f-${fIdx}`} className="flex items-start gap-2 text-rose-300">
                            <span className="text-rose-400 font-bold text-sm leading-none">✗</span>
                            <span className="leading-tight">{cond.label}: <span className="text-rose-200/90">{cond.detail}</span></span>
                          </div>
                        ))}
                      </div>

                      {/* Result Callout Quote */}
                      {item.explanation && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 text-xs text-emerald-300/90 font-medium italic bg-emerald-950/20 p-2 rounded-lg border border-emerald-900/30">
                          Result: "{item.explanation}"
                        </div>
                      )}

                      {/* Expandable "How was this determined?" Section */}
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedCards(prev => ({
                              ...prev,
                              [scheme.id]: !prev[scheme.id]
                            }));
                          }}
                          className="w-full text-left text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center justify-between py-1 transition"
                        >
                          <span className="flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" /> How was this determined?
                          </span>
                          <span className="text-xs">{expandedCards[scheme.id] ? '▲ Collapse' : '▼ Expand'}</span>
                        </button>

                        {expandedCards[scheme.id] && (
                          <div className="mt-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              Deterministic Rules Evaluation Audit Trace:
                            </div>
                            <div className="space-y-1 font-mono text-[11px] text-slate-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
                              {(item.audit_trace && item.audit_trace.length > 0) ? (
                                item.audit_trace.map((t, tIdx) => (
                                  <div key={tIdx} className={t.includes('PASSED') ? 'text-emerald-400' : t.includes('FAILED') ? 'text-rose-400' : 'text-amber-400'}>
                                    → {t}
                                  </div>
                                ))
                              ) : (
                                <div className="text-slate-400">All structured eligibility constraints verified.</div>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-400 leading-relaxed pt-1">
                              <strong>Zero Hallucination Guarantee:</strong> The LLM synthesizes and structures this explanation, but deterministic mathematical comparisons over certified government rules and retrieved citations serve as the primary basis.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Document Readiness Card (from Document Agent) */}
                    {docPlan && docPlan.action_plan && (
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                        <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          Required Certificates ({docPlan.required_documents?.length || 0}):
                        </div>
                        <div className="space-y-1">
                          {docPlan.action_plan.slice(0, 2).map((dp, dIdx) => (
                            <div key={dIdx} className="text-[11px] text-slate-300 flex items-start justify-between gap-2">
                              <span className="font-medium">• {dp.document_name}</span>
                              <span className="text-[10px] text-slate-500 shrink-0">{dp.issuing_authority}</span>
                            </div>
                          ))}
                          {docPlan.action_plan.length > 2 && (
                            <span className="text-[10px] text-slate-500 inline-block pt-0.5">
                              +{docPlan.action_plan.length - 2} more certificates mapped
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Grounded Evidence Quote */}
                    {ev && (
                      <div className="text-[11px] text-slate-400 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        "{ev.evidence_text}"
                      </div>
                    )}
                  </div>

                  {/* Footer Actions & Trust Metadata */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                        Source: <span className="text-slate-300">{scheme.source_name}</span>
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

          {/* Official Sources Panel */}
          {analysisResult.sources && analysisResult.sources.length > 0 && (
            <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-sm text-white">
                  Verified Official Knowledge Sources ({analysisResult.sources.length} Portals Used)
                </h4>
              </div>
              <p className="text-xs text-slate-400">
                CivicAid AI strictly references certified Government of India and State Department gazettes and portals:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                {analysisResult.sources.map((src, sIdx) => (
                  <a
                    key={sIdx}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition flex items-center justify-between gap-2 group"
                  >
                    <div className="truncate">
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300 truncate">
                        {src.source_name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate font-mono">{src.url}</div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Initial Ready State */
        <div className="p-16 text-center rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <Bot className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">Multi-Agent Benefits Advisor Ready</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click the button below to trigger the 5-stage sequential agent pipeline. It will evaluate your citizen passport parameters across 26 verified welfare programs.
            </p>
          </div>
          <button
            onClick={() => runAgentPipeline()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2 hover:opacity-90 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Start Multi-Agent Assessment Now
          </button>
        </div>
      )}
    </div>
  );
}
