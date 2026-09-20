import React, { useState, useEffect } from 'react';
import {
  Compass,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileCheck2,
  Sparkles,
  Layers,
  Building2,
  Info,
  ArrowRight,
  Bookmark,
  Save,
  Trash2,
  CheckSquare,
  Square,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  PhoneCall,
  Clock
} from 'lucide-react';
import { fetchSchemeApplicationGuide } from '../services/api';

export default function ApplicationCopilot({ schemes = [], initialScheme = null, onNavigateDocuments }) {
  const [selectedSchemeId, setSelectedSchemeId] = useState(
    initialScheme?.id || (schemes.length > 0 ? schemes[0].id : 'pm-kisan')
  );
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Active step in the 5-step guided workflow (1 to 5)
  const [activeStep, setActiveStep] = useState(1);

  // Pre-submission checklist items state
  const [checkedChecklist, setCheckedChecklist] = useState({});

  // Saved Application Reference Numbers (ARN) persisted in localStorage
  const [savedArns, setSavedArns] = useState(() => {
    try {
      const stored = localStorage.getItem('civicaid_saved_arns');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Current ARN input form state
  const [currentArnInput, setCurrentArnInput] = useState('');
  const [currentArnNotes, setCurrentArnNotes] = useState('');
  const [arnSavedNotification, setArnSavedNotification] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Fetch guide whenever selected scheme changes
  useEffect(() => {
    if (selectedSchemeId) {
      loadSchemeGuide(selectedSchemeId);
    }
  }, [selectedSchemeId]);

  const loadSchemeGuide = async (schemeId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSchemeApplicationGuide(schemeId);
      setGuide(data);
      // Reset checklist
      setCheckedChecklist({});
      // Populate existing saved ARN if available
      const existing = savedArns[schemeId];
      if (existing) {
        setCurrentArnInput(existing.arn || '');
        setCurrentArnNotes(existing.notes || '');
      } else {
        setCurrentArnInput('');
        setCurrentArnNotes('');
      }
    } catch (err) {
      console.error('Failed to load application guide:', err);
      setError('Could not retrieve application guide. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArn = () => {
    if (!currentArnInput.trim()) return;
    const newEntry = {
      scheme_id: selectedSchemeId,
      scheme_name: guide?.scheme_name || selectedSchemeId,
      arn: currentArnInput.trim(),
      notes: currentArnNotes.trim(),
      saved_at: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
    const updated = {
      ...savedArns,
      [selectedSchemeId]: newEntry
    };
    setSavedArns(updated);
    try {
      localStorage.setItem('civicaid_saved_arns', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    setArnSavedNotification(true);
    setTimeout(() => setArnSavedNotification(false), 3000);
  };

  const handleDeleteArn = (schemeId) => {
    const updated = { ...savedArns };
    delete updated[schemeId];
    setSavedArns(updated);
    try {
      localStorage.setItem('civicaid_saved_arns', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    if (schemeId === selectedSchemeId) {
      setCurrentArnInput('');
      setCurrentArnNotes('');
    }
  };

  const toggleChecklistItem = (idx) => {
    setCheckedChecklist((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const copyOfficialUrl = () => {
    if (guide?.official_application_source?.url) {
      navigator.clipboard.writeText(guide.official_application_source.url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5" /> Module 8: Application Copilot
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              AI Application Guidance & Roadmap <Sparkles className="w-5 h-5 text-teal-400" />
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl">
              End-to-end guidance from eligibility confirmation and document preparation to official portal submission and Reference Number tracking.
            </p>
          </div>

          {/* Scheme Switcher */}
          {schemes.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-xs text-slate-400 shrink-0 font-medium">Selected Scheme:</span>
              <select
                value={selectedSchemeId}
                onChange={(e) => setSelectedSchemeId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none max-w-xs cursor-pointer"
              >
                {schemes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Safety & Submission Ethics Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-teal-900/40 text-xs text-slate-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-teal-300">Official Portal Boundary & Safety Policy:</div>
          <p className="text-slate-400 leading-relaxed">
            "CivicAid AI does not simulate submitting applications to government systems." The copilot assists with preparation, required information checklists, and verified links to official government servers (.gov.in / .nic.in).
          </p>
        </div>
      </div>

      {/* Main Content Loading / Error / Data */}
      {loading ? (
        <div className="p-16 text-center rounded-2xl glass-panel border border-slate-800 space-y-4">
          <RefreshCw className="w-10 h-10 text-teal-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-300 font-semibold">Generating verified application roadmap...</p>
        </div>
      ) : error ? (
        <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      ) : guide ? (
        <div className="space-y-6">
          
          {/* ========================================================= */}
          {/* 5-STEP GUIDED WORKFLOW INTERACTIVE STEPPER BANNER         */}
          {/* ========================================================= */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-400" /> 5-Step Guided Application Roadmap
              </span>
              <span className="text-xs text-teal-400 font-mono font-semibold">
                Step {activeStep} of 5: {guide.guided_workflow[activeStep - 1]?.title}
              </span>
            </div>

            {/* Stepper Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {guide.guided_workflow.map((st) => {
                const isCurrent = activeStep === st.step_number;
                const isPassed = activeStep > st.step_number;
                return (
                  <button
                    key={st.step_number}
                    type="button"
                    onClick={() => setActiveStep(st.step_number)}
                    className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      isCurrent
                        ? 'bg-teal-950/70 border-teal-400 ring-2 ring-teal-500/30 shadow-lg'
                        : isPassed
                        ? 'bg-slate-900/80 border-slate-700 hover:border-slate-600'
                        : 'bg-slate-950/50 border-slate-800 opacity-70 hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-teal-400' : isPassed ? 'text-emerald-400' : 'text-slate-500'}`}>
                        STEP {st.step_number}
                      </span>
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-teal-400 animate-pulse' : 'bg-slate-700'}`}></span>
                      )}
                    </div>
                    <div className="font-bold text-xs text-white leading-tight">{st.title}</div>
                  </button>
                );
              })}
            </div>

            {/* Active Step Highlight Card */}
            {guide.guided_workflow[activeStep - 1] && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-teal-800/40 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-teal-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                        {activeStep}
                      </span>
                      {guide.guided_workflow[activeStep - 1].title}
                    </div>
                    <p className="text-xs text-slate-300">
                      {guide.guided_workflow[activeStep - 1].description}
                    </p>
                  </div>

                  {/* Contextual Action Button for Active Step */}
                  <div className="flex items-center gap-2 shrink-0">
                    {activeStep === 2 && onNavigateDocuments && (
                      <button
                        type="button"
                        onClick={onNavigateDocuments}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" /> Check Documents Checklist
                      </button>
                    )}

                    {activeStep === 3 && (
                      <a
                        href={guide.official_application_source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 text-xs font-black flex items-center gap-2 transition shadow-lg shadow-teal-500/20 cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" /> Start Application (Official Portal)
                      </a>
                    )}

                    {activeStep < 5 ? (
                      <button
                        type="button"
                        onClick={() => setActiveStep((prev) => Math.min(5, prev + 1))}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        Next Step <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveStep(1)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Review From Step 1
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-teal-950/30 border border-teal-900/40 text-[11px] text-teal-300 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Actionable Tip:</strong> {guide.guided_workflow[activeStep - 1].key_tip}</span>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 7 DETAILED APPLICATION GUIDANCE SECTIONS                  */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left 7 Columns: Scheme Overview, Steps, Information to Prepare */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* SECTION 1: ELIGIBILITY SUMMARY */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> 1. Eligibility Summary
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {guide.level} Government
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {guide.eligibility_summary}
                </p>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  Nodal Ministry: <span className="text-slate-300 font-medium">{guide.ministry}</span>
                </div>
              </div>

              {/* SECTION 3: STEP-BY-STEP APPLICATION PROCESS */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" /> 3. Step-by-Step Application Process
                </h3>
                <div className="space-y-2.5 pt-1">
                  {guide.step_by_step_process.map((stepText, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {sIdx + 1}
                      </span>
                      <p className="leading-relaxed">{stepText}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 5: WHAT INFORMATION TO PREPARE */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" /> 5. What Information to Prepare
                </h3>
                <p className="text-xs text-slate-400">
                  Keep these data fields handy on a notepad before opening the official government portal:
                </p>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  {guide.what_information_to_prepare.map((item, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 6: COMMON MISSING INFORMATION & PITFALLS */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" /> 6. Common Pitfalls & Rejection Causes
                </h3>
                <div className="space-y-2 pt-1">
                  {guide.common_missing_information.map((pitfall, pfIdx) => (
                    <div
                      key={pfIdx}
                      className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/30 text-xs text-rose-200/90 flex items-start gap-2"
                    >
                      <span className="text-rose-400 font-bold shrink-0">⚠</span>
                      <span>{pitfall}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right 5 Columns: Official Portal Action, Documents, Final Checklist, ARN Locker */}
            <div className="lg:col-span-5 space-y-6">

              {/* SECTION 4: OFFICIAL APPLICATION SOURCE & START BUTTON */}
              <div className="glass-panel rounded-2xl p-5 border border-teal-800/50 space-y-4 bg-gradient-to-b from-teal-950/30 to-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" /> 4. Official Portal
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Verified .gov.in
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-base text-white">
                    {guide.official_application_source.source_name || 'National Government Portal'}
                  </h4>
                  <p className="text-xs text-slate-400 break-all font-mono">
                    {guide.official_application_source.url}
                  </p>
                </div>

                {/* Primary Start Application Button */}
                <div className="pt-2 space-y-2">
                  <a
                    href={guide.official_application_source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition hover:opacity-95 shadow-xl shadow-teal-500/20 cursor-pointer text-center"
                  >
                    <span>Start Application</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={copyOfficialUrl}
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copied to Clipboard!' : 'Copy Portal URL'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 space-y-1">
                  <div><strong>Application Method:</strong> {guide.official_application_source.application_method}</div>
                  <div><strong>Support:</strong> {guide.official_application_source.helpline_info}</div>
                </div>
              </div>

              {/* SECTION 2: REQUIRED DOCUMENTS DETAILS */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-teal-400" /> 2. Required Documents ({guide.required_documents_details.length})
                  </h3>
                  {onNavigateDocuments && (
                    <button
                      type="button"
                      onClick={onNavigateDocuments}
                      className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold"
                    >
                      Open Scanner →
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {guide.required_documents_details.map((doc, dIdx) => (
                    <div key={dIdx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                      <div className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                        {doc.document_name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        <span className="text-slate-500 font-medium">Issuing Authority:</span> {doc.issuing_authority}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        <span className="text-slate-400 font-medium">Format:</span> {doc.format_guide}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 7: FINAL PRE-SUBMISSION CHECKLIST */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-400" /> 7. Final Pre-Submission Checklist
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {Object.values(checkedChecklist).filter(Boolean).length}/{guide.final_checklist.length} Verified
                  </span>
                </div>

                <div className="space-y-2">
                  {guide.final_checklist.map((item, chIdx) => {
                    const isChecked = !!checkedChecklist[chIdx];
                    return (
                      <button
                        key={chIdx}
                        type="button"
                        onClick={() => toggleChecklistItem(chIdx)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isChecked ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <div className="w-4 h-4 rounded border border-slate-600"></div>
                          )}
                        </div>
                        <span className="leading-tight">{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* APPLICATION REFERENCE NUMBER (ARN) LOCKER */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-cyan-400" /> Step 5: Application Reference Number (ARN) Locker
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">Local Offline Vault</span>
                </div>

                <p className="text-xs text-slate-400">
                  After submitting on the official portal, save your Application Reference Number here for real-time tracking:
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={currentArnInput}
                    onChange={(e) => setCurrentArnInput(e.target.value)}
                    placeholder="e.g. ARN-2026-9812498 or Acknowledgement No"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                  <input
                    type="text"
                    value={currentArnNotes}
                    onChange={(e) => setCurrentArnNotes(e.target.value)}
                    placeholder="Optional notes (e.g. Applied via CSC Center, Biometrics completed)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleSaveArn}
                      disabled={!currentArnInput.trim()}
                      className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Reference Record
                    </button>

                    {savedArns[selectedSchemeId] && (
                      <button
                        type="button"
                        onClick={() => handleDeleteArn(selectedSchemeId)}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove Record
                      </button>
                    )}
                  </div>

                  {arnSavedNotification && (
                    <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-1.5 animate-fadeIn">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Application Reference saved in your offline CivicAid vault!</span>
                    </div>
                  )}
                </div>

                {/* Display list of all saved ARNs */}
                {Object.keys(savedArns).length > 0 && (
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      All Tracked Applications ({Object.keys(savedArns).length}):
                    </span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {Object.values(savedArns).map((rec, rIdx) => (
                        <div
                          key={rIdx}
                          className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-start justify-between gap-2"
                        >
                          <div>
                            <div className="font-bold text-slate-200">{rec.scheme_name}</div>
                            <div className="font-mono text-teal-400 text-[11px] mt-0.5">ARN: {rec.arn}</div>
                            {rec.notes && <div className="text-[10px] text-slate-400 mt-0.5">{rec.notes}</div>}
                            <div className="text-[9px] text-slate-500 mt-0.5">Saved: {rec.saved_at}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteArn(rec.scheme_id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      ) : null}
    </div>
  );
}
