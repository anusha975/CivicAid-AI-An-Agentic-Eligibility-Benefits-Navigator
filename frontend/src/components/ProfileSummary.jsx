import React, { useState } from 'react';
import {
  ShieldCheck,
  MapPin,
  User,
  GraduationCap,
  Briefcase,
  IndianRupee,
  Target,
  Edit3,
  Copy,
  Check,
  Code2,
  Sparkles,
  ArrowRight,
  Download,
  AlertTriangle,
  Layers
} from 'lucide-react';

export default function ProfileSummary({ profile, normalizedProfile, onEditStep, onProceedToEligibility }) {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  // Use normalizedProfile from backend if available, otherwise build preview
  const profileId = normalizedProfile?.id || 'CA-PROF-DRAFT';
  const incomeSlab = normalizedProfile?.income_slab || 'Computed by Server';

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(normalizedProfile || profile, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Passport Header Banner */}
      <div className="glass-panel rounded-3xl p-6 border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-400 font-bold tracking-wider">
                  {profileId}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wide">
                  Verified Passport
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-0.5">Citizen Entitlement Profile</h2>
              <p className="text-xs text-slate-400">
                Ready for AI agent eligibility evaluation & DBT scheme matching.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJson(!showJson)}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Code2 className="w-3.5 h-3.5 text-teal-400" />
              {showJson ? 'Hide JSON' : 'Inspect JSON'}
            </button>
            <button
              onClick={onProceedToEligibility}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
            >
              Scan Schemes <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* JSON Inspector View */}
      {showJson && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-700 bg-slate-950/90 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-slate-300 font-mono">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Normalized User Profile Schema (Pydantic Output)</span>
            </div>
            <button
              onClick={handleCopyJson}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
          </div>
          <pre className="text-xs font-mono text-emerald-300/90 overflow-x-auto p-3 rounded-xl bg-slate-900/90 border border-slate-800 max-h-72">
            {JSON.stringify(normalizedProfile || profile, null, 2)}
          </pre>
        </div>
      )}

      {/* Structured Citizen Cards Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Geographic & Living Area */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Location & Habitat</span>
            </div>
            <button
              onClick={() => onEditStep(0)}
              className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center gap-1 border border-slate-700 transition"
            >
              <Edit3 className="w-3 h-3 text-emerald-400" /> Edit
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">State / UT:</span>
              <strong className="text-slate-100">{profile.state}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">District:</span>
              <strong className="text-slate-100">{profile.district}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Area Classification:</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                {profile.area_type}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Demographics & Social Category */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <User className="w-4 h-4 text-teal-400" />
              <span>Identity & Social Status</span>
            </div>
            <button
              onClick={() => onEditStep(1)}
              className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center gap-1 border border-slate-700 transition"
            >
              <Edit3 className="w-3 h-3 text-emerald-400" /> Edit
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Age & Gender:</span>
              <strong className="text-slate-100">
                {profile.age} Years, {profile.gender}
              </strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Social Category:</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                {profile.social_category}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Disability (PwD):</span>
              <strong className={profile.disability_status ? 'text-amber-400' : 'text-slate-400'}>
                {profile.disability_status ? `Yes (${profile.disability_percentage || 40}%)` : 'No'}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: Education & Occupation */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <GraduationCap className="w-4 h-4 text-cyan-400" />
              <span>Education & Profession</span>
            </div>
            <button
              onClick={() => onEditStep(2)}
              className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center gap-1 border border-slate-700 transition"
            >
              <Edit3 className="w-3 h-3 text-emerald-400" /> Edit
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Primary Occupation:</span>
              <strong className="text-slate-100">{profile.occupation}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Highest Education:</span>
              <strong className="text-slate-100">{profile.education_level}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Employment Category:</span>
              <span className="text-slate-300">{profile.employment_status}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Income & Special Circumstances */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <IndianRupee className="w-4 h-4 text-emerald-400" />
              <span>Finances & Circumstances</span>
            </div>
            <button
              onClick={() => onEditStep(3)}
              className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center gap-1 border border-slate-700 transition"
            >
              <Edit3 className="w-3 h-3 text-emerald-400" /> Edit
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Annual Family Income:</span>
              <strong className="text-emerald-400 font-bold">
                ₹{Number(profile.annual_family_income || 0).toLocaleString('en-IN')} / year
              </strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Income Slab:</span>
              <span className="text-[11px] text-teal-300 font-medium">{incomeSlab}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Special Tags:</span>
              <div className="flex flex-wrap gap-1">
                {(profile.special_circumstances || []).length > 0 ? (
                  profile.special_circumstances.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-300"
                    >
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-[11px]">None specified</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 5: Selected Welfare Goals */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Target Welfare Focus Areas ({profile.goals?.length || 0})</span>
          </div>
          <button
            onClick={() => onEditStep(4)}
            className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center gap-1 border border-slate-700 transition"
          >
            <Edit3 className="w-3 h-3 text-emerald-400" /> Edit Goals
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {(profile.goals || []).map((goalId) => (
            <span
              key={goalId}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold capitalize flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              {goalId}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-400 text-center sm:text-left">
          Profile cached locally and synced to backend. Ready for AI multi-criteria evaluation.
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onEditStep(0)}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            Edit All Fields
          </button>
          <button
            onClick={onProceedToEligibility}
            className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
          >
            Find Schemes with AI <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
