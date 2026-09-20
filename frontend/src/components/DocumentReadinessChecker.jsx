import React, { useState, useRef, useEffect } from 'react';
import {
  FileCheck2,
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
  RefreshCw,
  Sparkles,
  Layers,
  Building2,
  Info,
  ArrowRight,
  Eye,
  CheckSquare,
  Square
} from 'lucide-react';
import { analyzeDocument } from '../services/api';

export default function DocumentReadinessChecker({ schemes = [], initialScheme = null, citizenProfile = null }) {
  const [selectedSchemeId, setSelectedSchemeId] = useState(
    initialScheme?.id || (schemes.length > 0 ? schemes[0].id : '')
  );
  
  // Map of scheme_id -> Set of checked document names
  const [readyDocsMap, setReadyDocsMap] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // Get active selected scheme
  const currentScheme = schemes.find((s) => s.id === selectedSchemeId) || initialScheme || schemes[0] || {
    id: 'default',
    name: 'Standard Welfare Program',
    category: 'General',
    required_documents: [
      'Aadhaar Card',
      'College / Student ID Card',
      'Income Certificate',
      'Bank Account details linked with Aadhaar',
      'Marksheet / Previous Academic Qualification'
    ]
  };

  const requiredDocs = currentScheme?.required_documents || [
    'Aadhaar Card',
    'Income Certificate',
    'Bank Account Proof'
  ];

  // Initialize checked items from citizen profile or defaults
  useEffect(() => {
    if (!readyDocsMap[currentScheme.id]) {
      const initialChecked = new Set();
      // Auto-check if profile has aadhaar or bank details
      if (citizenProfile) {
        requiredDocs.forEach((doc) => {
          const dLower = doc.toLowerCase();
          if (dLower.includes('aadhaar') && citizenProfile.aadhaar_available !== false) {
            initialChecked.add(doc);
          }
          if (dLower.includes('college') || dLower.includes('student') || dLower.includes('marks')) {
            if (citizenProfile.occupation?.toLowerCase().includes('student')) {
              initialChecked.add(doc);
            }
          }
        });
      }
      // Default demo initial state if none matched: 3/5 ready
      if (initialChecked.size === 0 && requiredDocs.length >= 3) {
        initialChecked.add(requiredDocs[0]);
        if (requiredDocs.length > 1) initialChecked.add(requiredDocs[1]);
        if (requiredDocs.length > 4) initialChecked.add(requiredDocs[4]);
      }
      setReadyDocsMap((prev) => ({
        ...prev,
        [currentScheme.id]: initialChecked
      }));
    }
  }, [currentScheme.id, citizenProfile]);

  const activeReadySet = readyDocsMap[currentScheme.id] || new Set();
  const readyCount = requiredDocs.filter((d) => activeReadySet.has(d)).length;
  const totalCount = requiredDocs.length;
  const progressPercent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;
  const missingDocs = requiredDocs.filter((d) => !activeReadySet.has(d));

  // Toggle manual checklist checkbox
  const toggleDocCheck = (docName) => {
    setReadyDocsMap((prev) => {
      const curSet = new Set(prev[currentScheme.id] || []);
      if (curSet.has(docName)) {
        curSet.delete(docName);
      } else {
        curSet.add(docName);
      }
      return {
        ...prev,
        [currentScheme.id]: curSet
      };
    });
  };

  // Handle document upload & analysis
  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadedFile(file);
    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeDocument(file, currentScheme.id, requiredDocs);
      setAnalysisResult(result);

      // Auto-check matched requirement in the checklist
      if (result.matched_requirement) {
        const matched = requiredDocs.find(
          (d) => d.toLowerCase() === result.matched_requirement.toLowerCase() ||
                 result.matched_requirement.toLowerCase().includes(d.toLowerCase()) ||
                 d.toLowerCase().includes(result.document_type.toLowerCase())
        );
        if (matched) {
          setReadyDocsMap((prev) => {
            const curSet = new Set(prev[currentScheme.id] || []);
            curSet.add(matched);
            return {
              ...prev,
              [currentScheme.id]: curSet
            };
          });
        }
      }
    } catch (err) {
      console.error('Document analysis error:', err);
      setError(err.message || 'Failed to analyze document. You can still check items manually.');
    } finally {
      setAnalyzing(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <FileCheck2 className="w-3.5 h-3.5" /> Module 7: Document Readiness Checker
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Document Preparation Assistant <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl">
              Inspect your certificates before applying. Upload sample PDFs or images to auto-classify document types, verify requirements, or manually toggle checklist readiness.
            </p>
          </div>

          {/* Scheme Selector */}
          {schemes.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-xs text-slate-400 shrink-0 font-medium">Evaluating Scheme:</span>
              <select
                value={selectedSchemeId}
                onChange={(e) => {
                  setSelectedSchemeId(e.target.value);
                  setAnalysisResult(null);
                  setError(null);
                }}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none max-w-xs cursor-pointer"
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

      {/* Mandatory Privacy & Ethical Disclosures Notice */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-900/40 text-xs text-slate-300 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-amber-300">Privacy & Legal Verification Disclaimer:</div>
          <p className="text-slate-400 leading-relaxed">
            "Documents are processed for assistance and should not be treated as officially verified." CivicAid AI analyzes structural formats locally to assist with scheme readiness. We never make legal authenticity determinations, nor store biometric credentials.
          </p>
        </div>
      </div>

      {/* Main Grid: Checklist & Progress + Upload & Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols): Progress & Interactive Required Documents Checklist */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            
            {/* Progress Header */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" /> Document Readiness
                </span>
                <span className="font-mono font-bold text-emerald-400 text-xs">
                  {readyCount} / {totalCount} ready ({progressPercent}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progressPercent === 100
                      ? 'bg-emerald-400'
                      : progressPercent >= 60
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-amber-500 to-orange-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Scheme Title Badge */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Target Scheme:
              </span>
              <span className="font-bold text-white leading-snug">{currentScheme.name}</span>
            </div>

            {/* Required Documents Interactive Checklist */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Required Documents:</span>
                <span className="text-[10px] text-slate-500 font-normal">Click to toggle manual status</span>
              </div>

              <div className="space-y-2">
                {requiredDocs.map((doc, idx) => {
                  const isChecked = activeReadySet.has(doc);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDocCheck(doc)}
                      className={`w-full text-left p-3 rounded-xl border text-xs flex items-start gap-3 transition cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-950/30 border-emerald-800/60 text-slate-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <div className="w-4 h-4 rounded border border-slate-600"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold ${isChecked ? 'text-emerald-300' : 'text-slate-300'}`}>
                          {isChecked ? `☑ ${doc}` : `☐ ${doc}`}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {isChecked ? 'Ready / Uploaded' : 'Action Required (Upload or verify)'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Missing Documents Summary Box */}
            {missingDocs.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 text-xs space-y-1.5">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  Missing Documents ({missingDocs.length}):
                </div>
                <ul className="space-y-1 text-slate-300 text-[11px] pl-5 list-disc">
                  {missingDocs.map((md, mIdx) => (
                    <li key={mIdx} className="text-rose-200/90 font-medium">
                      {md}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-xs text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                All {totalCount} mandatory documents ready for application!
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 Cols): Upload Dropzone & AI Document Inspection */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-400" /> Upload Sample Document
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">PDF, JPG, PNG, WEBP</span>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-300 ${
                dragOver
                  ? 'border-amber-400 bg-amber-950/30 scale-[1.01]'
                  : 'border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {analyzing ? (
                <div className="space-y-3 py-2">
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">Analyzing Document Structure...</p>
                    <p className="text-[11px] text-slate-400">Extracting text & matching against scheme requirements</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-1">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-200">
                    Click to select or drag & drop certificate
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Upload sample Aadhaar, Income Certificate, Marks Memo, College ID, or Bank Passbook
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* AI Analysis Result Card */}
            {analysisResult && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-white">
                      Identified Document: <span className="text-amber-400">{analysisResult.document_type}</span>
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {Math.round(analysisResult.confidence * 100)}% Confidence
                  </span>
                </div>

                {/* Requirement Alignment */}
                {analysisResult.matched_requirement ? (
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-start gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Requirement Matched:</span> {analysisResult.matched_requirement}
                      <span className="block text-[10px] text-emerald-400/80 mt-0.5">
                        ✓ Automatically marked as ready in checklist.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
                    Document identified as <strong>{analysisResult.document_type}</strong>. You can manually assign it to a requirement.
                  </div>
                )}

                {/* Detected Fields Table */}
                {analysisResult.detected_fields && Object.keys(analysisResult.detected_fields).length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Detected Structural Fields:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {Object.entries(analysisResult.detected_fields).map(([key, val]) => (
                        <div key={key} className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase block font-mono">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="font-semibold text-slate-200 truncate block">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification Warnings & Privacy Disclaimers */}
                {analysisResult.warnings && analysisResult.warnings.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    {analysisResult.warnings.map((warn, wIdx) => (
                      <div key={wIdx} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>{warn}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Demo Pre-load Samples */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Quick Test with Synthetic Sample Text:</span>
                <span className="text-[10px] text-slate-500">Hackathon Simulation</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([
                      "GOVERNMENT OF TELANGANA - REVENUE DEPARTMENT\nINCOME CERTIFICATE\nThis is to certify that Sri/Smt Ravi Kumar annual family income from all sources is Rs. 1,80,000.\nIssued by Tahasildar / Revenue Officer 2025"
                    ], { type: "text/plain" });
                    const file = new File([blob], "Income_Certificate_2025.txt", { type: "text/plain" });
                    handleFileUpload(file);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-amber-300 font-medium transition cursor-pointer"
                >
                  📄 Test Income Certificate
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([
                      "JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY\nSTUDENT IDENTITY CARD\nName: Arjun Rao\nRoll No: 22011A0542\nDepartment of Computer Science & Engineering\nAcademic Year 2024-2026 Bonafide Student"
                    ], { type: "text/plain" });
                    const file = new File([blob], "College_Student_ID.txt", { type: "text/plain" });
                    handleFileUpload(file);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-cyan-300 font-medium transition cursor-pointer"
                >
                  🎓 Test College ID
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([
                      "STATE BANK OF INDIA\nSAVINGS BANK PASSBOOK\nAccount No: 38291048291\nIFSC: SBIN0001234\nBranch: Hyderabad Main Branch\nAadhaar NPCI Mapping: Verified Active"
                    ], { type: "text/plain" });
                    const file = new File([blob], "SBI_Bank_Passbook.txt", { type: "text/plain" });
                    handleFileUpload(file);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-emerald-300 font-medium transition cursor-pointer"
                >
                  🏦 Test Bank Passbook
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
