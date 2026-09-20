import React, { useState, useEffect } from 'react';
import {
  MapPin,
  User,
  GraduationCap,
  Briefcase,
  IndianRupee,
  Target,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  Sparkles,
  Building2,
  Tractor,
  Laptop,
  HelpCircle,
  HeartHandshake,
  Home,
  HeartPulse,
  BadgePercent,
  Compass
} from 'lucide-react';
import { INDIA_LOCATIONS, INDIAN_STATES } from '../data/indiaLocations';
import {
  PRESET_PROFILES,
  validateStep,
  calculateCompletionPercentage,
  saveDraftProfile,
  saveProfileToServer
} from '../services/profileStore';

const STEPS = [
  { id: 'location', title: 'Location & Habitat', icon: MapPin, desc: 'State, district, and rural/urban living area' },
  { id: 'demographics', title: 'Personal Demographics', icon: User, desc: 'Age, gender, social category, and PwD status' },
  { id: 'education_work', title: 'Education & Work', icon: GraduationCap, desc: 'Highest qualification and occupational group' },
  { id: 'finances', title: 'Income & Circumstances', icon: IndianRupee, desc: 'Annual family income and special circumstances' },
  { id: 'goals', title: 'Welfare Goals', icon: Target, desc: 'Target schemes, subsidies, and assistance sought' },
];

const OCCUPATION_OPTIONS = [
  { id: 'Farmer', label: 'Farmer / Agri Worker', icon: Tractor, desc: 'Cultivator, tenant farmer, agricultural labor' },
  { id: 'Student', label: 'Student / Scholar', icon: GraduationCap, desc: 'School, college, vocational, research' },
  { id: 'Working', label: 'Working Professional', icon: Briefcase, desc: 'Salaried employee, wage earner' },
  { id: 'Entrepreneur', label: 'Entrepreneur / MSME', icon: Laptop, desc: 'Self-employed, small business owner, artisan' },
  { id: 'Unemployed', label: 'Unemployed / Job Seeker', icon: Compass, desc: 'Actively seeking work or training' },
  { id: 'Other', label: 'Other / Homemaker', icon: HelpCircle, desc: 'Retired, homemaker, caregiver' },
];

const EDUCATION_LEVELS = [
  'No formal education',
  'Primary (Up to 5th)',
  'Middle School (6th - 8th)',
  'Secondary / 10th Pass',
  'Higher Secondary / 12th Pass',
  'Diploma / ITI / Vocational',
  'Graduate / Bachelor\'s Degree',
  'Post Graduate / Master\'s / Doctorate'
];

const SOCIAL_CATEGORIES = [
  { id: 'General', label: 'General / Open', desc: 'Unreserved category' },
  { id: 'OBC (Other Backward Classes)', label: 'OBC', desc: 'Non-creamy & creamy layer backward classes' },
  { id: 'SC (Scheduled Caste)', label: 'SC', desc: 'Scheduled caste communities' },
  { id: 'ST (Scheduled Tribe)', label: 'ST', desc: 'Scheduled tribe indigenous communities' },
  { id: 'EWS (Economically Weaker Section)', label: 'EWS', desc: 'Economically weaker section in general category' },
];

const EMPLOYMENT_STATUSES = [
  'Agricultural Labor',
  'Daily Wage / Casual Labor',
  'Self-Employed / Business',
  'Salaried (Private)',
  'Salaried (Government / PSU)',
  'Student',
  'Unemployed (Seeking Work)',
  'Homemaker',
  'Retired / Pensioner'
];

const SPECIAL_CIRCUMSTANCES = [
  'BPL Ration Card Holder',
  'Small/Marginal Farmer',
  'Woman Head of Household',
  'Single Parent / Widow',
  'Religious / Linguistic Minority',
  'First Generation Learner',
  'Gig / Platform Worker',
  'Migrant Worker',
  'Ex-Serviceman / Defense Ward'
];

const WELFARE_GOALS = [
  { id: 'scholarship', label: 'Scholarships & Fellowships', icon: GraduationCap, desc: 'Tuition waivers, hostel grants, stipends' },
  { id: 'education', label: 'Skill Training & Education', icon: Laptop, desc: 'Vocational courses, coaching assistance' },
  { id: 'agriculture', label: 'Farmer & Agri Subsidies', icon: Tractor, desc: 'PM-KISAN, crop insurance, equipment grants' },
  { id: 'healthcare', label: 'Healthcare & Insurance', icon: HeartPulse, desc: 'Ayushman Bharat, cashless hospitalization' },
  { id: 'housing', label: 'Housing & Sanitation Grants', icon: Home, desc: 'PMAY home subsidies, rural housing' },
  { id: 'employment', label: 'Job Placement & Training', icon: Briefcase, desc: 'Apprenticeships, MGNREGA, Rozgar Mela' },
  { id: 'entrepreneurship', label: 'Business Loans & Mudra', icon: BadgePercent, desc: 'Micro-credit, PMEGP, collateral-free credit' },
  { id: 'financial assistance', label: 'Direct Cash Transfer (DBT)', icon: IndianRupee, desc: 'Social pensions, emergency income support' },
];

export default function ProfileWizard({ profile, setProfile, onComplete, initialStep = 0 }) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Update currentStep if initialStep prop changes
  useEffect(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  // Sync draft to localStorage on profile change
  useEffect(() => {
    saveDraftProfile(profile);
  }, [profile]);

  // District options based on chosen state
  const availableDistricts = INDIA_LOCATIONS[profile.state] || [];

  const handleStateChange = (newState) => {
    const districts = INDIA_LOCATIONS[newState] || [];
    setProfile({
      ...profile,
      state: newState,
      district: districts[0] || ''
    });
    if (errors.state || errors.district) {
      setErrors({ ...errors, state: undefined, district: undefined });
    }
  };

  const handleFieldChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleToggleGoal = (goalId) => {
    const existing = profile.goals || [];
    const nextGoals = existing.includes(goalId)
      ? existing.filter((g) => g !== goalId)
      : [...existing, goalId];
    handleFieldChange('goals', nextGoals);
  };

  const handleToggleCircumstance = (circ) => {
    const existing = profile.special_circumstances || [];
    const nextCircs = existing.includes(circ)
      ? existing.filter((c) => c !== circ)
      : [...existing, circ];
    handleFieldChange('special_circumstances', nextCircs);
  };

  const handleLoadPreset = (preset) => {
    setProfile({ ...preset.data });
    setErrors({});
    setSaveSuccessMsg(`Loaded preset: ${preset.name}`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleNext = () => {
    const validation = validateStep(currentStep, profile);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinalSave();
    }
  };

  const handlePrev = () => {
    setErrors({});
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSave = async () => {
    setSaving(true);
    try {
      const res = await saveProfileToServer(profile);
      setSaveSuccessMsg('Profile successfully saved to CivicAid server!');
      if (onComplete) {
        onComplete(res.profile);
      }
    } catch (err) {
      alert(`Could not save profile to backend: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const completionPercent = calculateCompletionPercentage(profile);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Presets Quick Bar (Super useful for hackathon presentations) */}
      <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium">Quick Demo Profiles:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_PROFILES.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadPreset(p)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition"
              title={p.subtitle}
            >
              {p.name.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Wizard Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-8 border border-slate-800 shadow-2xl">
        {/* Progress & Step Indicator */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-2">
              Step {currentStep + 1} of {STEPS.length}:{' '}
              <span className="text-emerald-400">{STEPS[currentStep].title}</span>
            </span>
            <span className="font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
              {completionPercent}% Complete
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          {/* Step Badges Navigation */}
          <div className="grid grid-cols-5 gap-2 pt-2">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    // Allow navigating directly to visited or prior steps
                    setCurrentStep(idx);
                  }}
                  className={`flex flex-col items-center text-center p-2 rounded-xl transition border text-xs ${
                    isActive
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-white shadow-md shadow-emerald-500/10'
                      : isPast
                      ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      : 'bg-slate-900/30 border-slate-800/50 text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : isPast ? 'text-emerald-500' : 'text-slate-600'}`} />
                    {isPast && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                  </div>
                  <span className="text-[10px] font-medium hidden sm:inline truncate max-w-full">
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Heading */}
        <div className="border-b border-slate-800/80 pb-4">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            {React.createElement(STEPS[currentStep].icon, { className: 'w-5 h-5 text-emerald-400' })}
            {STEPS[currentStep].title}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{STEPS[currentStep].desc}</p>
        </div>

        {/* STEP 0: LOCATION & HABITAT */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* State */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  State / Union Territory <span className="text-emerald-400">*</span>
                </label>
                <select
                  value={profile.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.state}
                  </p>
                )}
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  District <span className="text-emerald-400">*</span>
                </label>
                {availableDistricts.length > 0 ? (
                  <select
                    value={profile.district}
                    onChange={(e) => handleFieldChange('district', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={profile.district}
                    onChange={(e) => handleFieldChange('district', e.target.value)}
                    placeholder="Enter district name"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                )}
                {errors.district && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.district}
                  </p>
                )}
              </div>
            </div>

            {/* Living Environment (Rural / Semi-Urban / Urban) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Living Area Type <span className="text-emerald-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'Rural', label: 'Rural (Village / Gram Panchayat)', desc: 'Eligible for rural housing, agriculture DBT, and MGNREGA' },
                  { id: 'Semi-Urban', label: 'Semi-Urban (Town / Block)', desc: 'Eligible for mixed central schemes and municipal aid' },
                  { id: 'Urban', label: 'Urban (Tier 1/2/3 City)', desc: 'Eligible for urban housing, gig worker social security' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleFieldChange('area_type', item.id)}
                    className={`p-3.5 rounded-xl border text-left transition ${
                      profile.area_type === item.id
                        ? 'bg-emerald-500/15 border-emerald-500/60 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white mb-1 flex items-center justify-between">
                      <span>{item.id}</span>
                      {profile.area_type === item.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{item.desc}</p>
                  </button>
                ))}
              </div>
              {errors.area_type && (
                <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.area_type}
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: PERSONAL DEMOGRAPHICS */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Age (in years) <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={profile.age}
                  onChange={(e) => handleFieldChange('age', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex gap-2 mt-2">
                  {[18, 25, 40, 60].map((quickAge) => (
                    <button
                      key={quickAge}
                      type="button"
                      onClick={() => handleFieldChange('age', quickAge)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300"
                    >
                      {quickAge} yrs
                    </button>
                  ))}
                </div>
                {errors.age && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.age}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Gender <span className="text-emerald-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleFieldChange('gender', g)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition ${
                        profile.gender === g
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                {errors.gender && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.gender}
                  </p>
                )}
              </div>
            </div>

            {/* Social Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Social Category (Caste / Reservation) <span className="text-emerald-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {SOCIAL_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleFieldChange('social_category', cat.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      profile.social_category === cat.id
                        ? 'bg-emerald-500/15 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-white mb-0.5 flex items-center justify-between">
                      <span>{cat.label}</span>
                      {profile.social_category === cat.id && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400">{cat.desc}</p>
                  </button>
                ))}
              </div>
              {errors.social_category && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.social_category}
                </p>
              )}
            </div>

            {/* Disability Status */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Person with Disability (PwD)</h4>
                  <p className="text-[11px] text-slate-400">
                    Unlocks specialized assistance, aids, and enhanced scholarship quotas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleFieldChange('disability_status', !profile.disability_status)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    profile.disability_status ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition" />
                </button>
              </div>

              {profile.disability_status && (
                <div className="pt-3 border-t border-slate-800">
                  <label className="block text-xs text-slate-300 mb-1">
                    Disability Percentage: <strong className="text-emerald-400">{profile.disability_percentage || 40}%</strong>
                  </label>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    step="5"
                    value={profile.disability_percentage || 40}
                    onChange={(e) => handleFieldChange('disability_percentage', parseInt(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>40% (Minimum for PwD reservation)</span>
                    <span>100% (Severe)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: EDUCATION & WORK */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Primary Occupation Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Primary Occupational Classification <span className="text-emerald-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {OCCUPATION_OPTIONS.map((occ) => {
                  const Icon = occ.icon;
                  const isSelected = profile.occupation === occ.id;
                  return (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => handleFieldChange('occupation', occ.id)}
                      className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white mb-0.5">{occ.label}</div>
                        <p className="text-[10px] text-slate-400">{occ.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.occupation && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.occupation}
                </p>
              )}
            </div>

            {/* Education Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Highest Completed Education Level <span className="text-emerald-400">*</span>
              </label>
              <select
                value={profile.education_level}
                onChange={(e) => handleFieldChange('education_level', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {EDUCATION_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
              {errors.education_level && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.education_level}
                </p>
              )}
            </div>

            {/* Employment Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Current Employment Status <span className="text-emerald-400">*</span>
              </label>
              <select
                value={profile.employment_status}
                onChange={(e) => handleFieldChange('employment_status', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {EMPLOYMENT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              {errors.employment_status && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.employment_status}
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: HOUSEHOLD & INCOME */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Annual Family Income */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Total Annual Family Income (INR) <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <input
                  type="number"
                  step="10000"
                  min="0"
                  value={profile.annual_family_income}
                  onChange={(e) => handleFieldChange('annual_family_income', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Quick Sliders / Preset Slabs */}
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { label: '< ₹1 Lakh (Antyodaya)', value: 90000 },
                  { label: '₹1.8 Lakhs (BPL)', value: 180000 },
                  { label: '₹2.5 Lakhs (EWS Limit)', value: 250000 },
                  { label: '₹6 Lakhs (OBC-NCL)', value: 600000 },
                ].map((slab) => (
                  <button
                    key={slab.value}
                    type="button"
                    onClick={() => handleFieldChange('annual_family_income', slab.value)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700/60"
                  >
                    {slab.label}
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 mt-3 text-xs text-slate-300 flex items-center justify-between">
                <span>Calculated Household Income:</span>
                <strong className="text-emerald-400 font-bold text-sm">
                  ₹{Number(profile.annual_family_income || 0).toLocaleString('en-IN')} / year
                </strong>
              </div>

              {errors.annual_family_income && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.annual_family_income}
                </p>
              )}
            </div>

            {/* Special Circumstances Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Special Circumstances (Check all that apply)
              </label>
              <p className="text-[11px] text-slate-400 mb-2.5">
                These tags automatically trigger priority weightings in state and central welfare algorithms.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {SPECIAL_CIRCUMSTANCES.map((circ) => {
                  const isChecked = (profile.special_circumstances || []).includes(circ);
                  return (
                    <button
                      key={circ}
                      type="button"
                      onClick={() => handleToggleCircumstance(circ)}
                      className={`p-2.5 rounded-xl border text-xs text-left transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{circ}</span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: WELFARE GOALS */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Your Key Welfare Goals & Interests <span className="text-emerald-400">*</span>
              </label>
              <p className="text-[11px] text-slate-400 mb-4">
                Choose the schemes and assistance streams our AI agents should prioritize for you.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WELFARE_GOALS.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = (profile.goals || []).includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => handleToggleGoal(goal.id)}
                      className={`p-4 rounded-xl border text-left transition flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className={`p-2.5 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {goal.label}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">{goal.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {errors.goals && (
                <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.goals}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {saving ? (
                <>Saving Profile...</>
              ) : currentStep === STEPS.length - 1 ? (
                <>
                  <Save className="w-4 h-4" /> Save & Generate Passport
                </>
              ) : (
                <>
                  Continue <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
