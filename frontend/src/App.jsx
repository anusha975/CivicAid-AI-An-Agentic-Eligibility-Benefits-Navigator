import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Sparkles,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Users,
  ChevronRight,
  IndianRupee,
  Cpu,
  RefreshCw,
  UserCheck,
  Compass,
  FileCheck2,
  BookOpen,
  Bot,
  ArrowRight,
  GraduationCap,
  Tractor,
  Briefcase,
  HelpCircle,
  Home,
  Check
} from 'lucide-react';
import { checkBackendHealth, fetchSchemes, evaluateCitizenEligibility } from './services/api';
import {
  getSavedDraftProfile,
  calculateCompletionPercentage,
  saveProfileToServer,
  saveDraftProfile
} from './services/profileStore';
import ProfileWizard from './components/ProfileWizard';
import ProfileSummary from './components/ProfileSummary';
import AISchemeSearch from './components/AISchemeSearch';
import AIBenefitsAdvisor from './components/AIBenefitsAdvisor';
import DocumentReadinessChecker from './components/DocumentReadinessChecker';
import ApplicationCopilot from './components/ApplicationCopilot';

const DEFAULT_CATEGORIES = [
  'All',
  'Agriculture',
  'Healthcare',
  'Housing',
  'Scholarships',
  'Entrepreneurship',
  'Financial assistance',
  'Employment',
  'Women',
  'Education'
];

export default function App() {
  const [health, setHealth] = useState({ status: 'checking', version: '1.0.0' });
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Citizen profile state loaded from local draft
  const [profile, setProfile] = useState(() => getSavedDraftProfile());
  const [normalizedProfile, setNormalizedProfile] = useState(null);
  const [wizardStep, setWizardStep] = useState(0);

  const [evaluationResults, setEvaluationResults] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [selectedSchemeDetail, setSelectedSchemeDetail] = useState(null);
  
  // Navigation tabs: 'home' | 'advisor' | 'search' | 'wizard' | 'passport' | 'documents' | 'copilot' | 'explore' | 'evaluate'
  const [activeTab, setActiveTab] = useState('home');

  // Check health and load schemes on mount
  useEffect(() => {
    async function init() {
      setLoading(true);
      const healthData = await checkBackendHealth();
      setHealth(healthData);

      try {
        const schemesData = await fetchSchemes();
        setSchemes(schemesData);
      } catch (err) {
        console.error('Failed to load initial schemes:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Filter schemes in Explore tab
  const filteredSchemes = schemes.filter((s) => {
    const matchCat = selectedCategory === 'All' || s.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.tags && s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchCat && matchSearch;
  });

  // Trigger eligibility evaluation using profile
  const handleRunEvaluation = async () => {
    setEvaluating(true);
    try {
      const evalProfile = {
        age: profile.age ? parseInt(profile.age) : undefined,
        gender: profile.gender || undefined,
        state: profile.state || 'All India',
        category: profile.social_category || 'General',
        annual_income: profile.annual_family_income ? parseInt(profile.annual_family_income) : undefined,
        occupation: profile.occupation || undefined,
        employment: profile.employment_status || undefined,
        education: profile.education_level || undefined,
        has_agricultural_land: profile.has_agricultural_land || false,
        landholding_acres: profile.landholding_acres ? parseFloat(profile.landholding_acres) : undefined,
        owns_pucca_house: profile.owns_pucca_house || false,
        has_disability: profile.disability_status || false,
        marital_status: profile.marital_status || 'Single',
        is_tax_payer: profile.is_tax_payer || false
      };
      const res = await evaluateCitizenEligibility(evalProfile);
      setEvaluationResults(res);
      setActiveTab('evaluate');
    } catch (err) {
      console.error('Evaluation failed:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleWizardComplete = async (finalProfile) => {
    setProfile(finalProfile);
    try {
      const saved = await saveProfileToServer(finalProfile);
      setNormalizedProfile(saved);
    } catch (e) {
      console.warn('Could not sync to server database:', e);
    }
    setActiveTab('advisor');
  };

  const handleEditStep = (stepIndex) => {
    setWizardStep(stepIndex);
    setActiveTab('wizard');
  };

  // 1-Click Demo Profiles for Hackathon Demo Flow
  const loadDemoProfile = (type) => {
    let demoData = {};
    if (type === 'student') {
      demoData = {
        name: 'Arjun Rao',
        age: 20,
        gender: 'Male',
        state: 'Telangana',
        district: 'Hyderabad',
        social_category: 'SC',
        annual_family_income: 180000,
        occupation: 'Student',
        education_level: 'Undergraduate (B.Tech CSE)',
        employment_status: 'Unemployed',
        has_agricultural_land: false,
        owns_pucca_house: false,
        disability_status: false,
        marital_status: 'Single',
        is_tax_payer: false,
        aadhaar_available: true,
        bank_account_ready: true
      };
    } else if (type === 'farmer') {
      demoData = {
        name: 'Ramesh Patel',
        age: 42,
        gender: 'Male',
        state: 'Madhya Pradesh',
        district: 'Sehore',
        social_category: 'OBC',
        annual_family_income: 120000,
        occupation: 'Farmer',
        education_level: 'Secondary (10th)',
        employment_status: 'Self-Employed',
        has_agricultural_land: true,
        landholding_acres: 2.5,
        owns_pucca_house: false,
        disability_status: false,
        marital_status: 'Married',
        is_tax_payer: false,
        aadhaar_available: true,
        bank_account_ready: true
      };
    } else if (type === 'woman_entrepreneur') {
      demoData = {
        name: 'Sunita Devi',
        age: 32,
        gender: 'Female',
        state: 'Karnataka',
        district: 'Bangalore Rural',
        social_category: 'General',
        annual_family_income: 240000,
        occupation: 'Artisan / Entrepreneur',
        education_level: 'Higher Secondary (12th)',
        employment_status: 'Self-Employed',
        has_agricultural_land: false,
        owns_pucca_house: true,
        disability_status: false,
        marital_status: 'Married',
        is_tax_payer: false,
        aadhaar_available: true,
        bank_account_ready: true
      };
    }

    setProfile(demoData);
    saveDraftProfile(demoData);
    setActiveTab('advisor');
  };

  const completionPercent = calculateCompletionPercentage(profile);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Ambient Light Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/10 blur-[120px] pointer-events-none z-0"></div>

      {/* Main Header Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
              <ShieldCheck className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  CivicAid<span className="text-emerald-400">.AI</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden sm:inline">
                  GovTech India
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'home'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('advisor')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                activeTab === 'advisor'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-500/30'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Advisor</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-900/60 text-emerald-300 border border-emerald-500/30 font-mono hidden lg:inline">
                5-Agent
              </span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                activeTab === 'search'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">RAG Search</span>
              <span className="sm:hidden">Search</span>
            </button>

            <button
              onClick={() => setActiveTab('wizard')}
              className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                activeTab === 'wizard'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Profile Wizard</span>
              <span className="md:hidden">Profile</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                {completionPercent}%
              </span>
            </button>

            <button
              onClick={() => setActiveTab('passport')}
              className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                activeTab === 'passport'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden lg:inline">Citizen Passport</span>
              <span className="lg:hidden">Passport</span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                activeTab === 'documents'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Documents</span>
            </button>

            <button
              onClick={() => setActiveTab('copilot')}
              className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                activeTab === 'copilot'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-teal-400" />
              <span>Copilot</span>
            </button>

            <button
              onClick={() => setActiveTab('explore')}
              className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                activeTab === 'explore'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Schemes</span>
              <span className="text-[10px] text-slate-500 font-mono">({schemes.length})</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Interactive Views */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ========================================================= */}
        {/* VIEW 0: FINAL LANDING PAGE (TASK 1)                       */}
        {/* ========================================================= */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            
            {/* Hero Section */}
            <div className="text-center max-w-4xl mx-auto space-y-6 pt-6 pb-4 relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-4 h-4" /> AI-Powered Government Welfare & Benefits Navigator
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Find the government benefits you{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  may be eligible for.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                CivicAid AI uses explainable deterministic rules, multi-agent reasoning, and zero-hallucination RAG retrieval to evaluate citizen eligibility across 26+ verified Central and State programs.
              </p>

              {/* Primary & Secondary Call to Action */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('wizard')}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> Start Eligibility Check
                </button>

                <button
                  onClick={() => setActiveTab('explore')}
                  className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-slate-400" /> Explore Schemes ({schemes.length})
                </button>
              </div>

              {/* 1-Click Fast Demo Scenario Switcher (Task 2 Demo Flow) */}
              <div className="pt-6 border-t border-slate-800/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  🚀 1-Click Hackathon Demo Persona Loader:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    onClick={() => loadDemoProfile('student')}
                    className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm"
                  >
                    <GraduationCap className="w-4 h-4 text-cyan-400" />
                    <span>Student • Telangana • B.Tech Engineering</span>
                  </button>

                  <button
                    onClick={() => loadDemoProfile('farmer')}
                    className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm"
                  >
                    <Tractor className="w-4 h-4 text-emerald-400" />
                    <span>Farmer • Madhya Pradesh • 2.5 Acres</span>
                  </button>

                  <button
                    onClick={() => loadDemoProfile('woman_entrepreneur')}
                    className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm"
                  >
                    <Briefcase className="w-4 h-4 text-amber-400" />
                    <span>Woman Entrepreneur • Karnataka</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">5-Agent Eligibility System</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Coordinated Strands agent architecture evaluating citizen profiles, discovering programs, strictly classifying rules, mapping certificates, and generating guides.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">Local Semantic RAG Engine</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Zero paid external API dependency vector retrieval over verified government gazettes, returning verbatim supporting evidence and official sources.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">Document Preparation & Copilot</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatic PDF/Image document structure inspection with PII masking, 5-step application roadmaps, and offline Reference Number (ARN) tracking.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 1: AI BENEFITS ADVISOR (MULTI-AGENT) */}
        {activeTab === 'advisor' && (
          <AIBenefitsAdvisor
            citizenProfile={profile}
            onSelectScheme={(scheme) => {
              setSelectedSchemeDetail(scheme);
              setActiveTab('copilot');
            }}
            onEditProfile={() => setActiveTab('wizard')}
          />
        )}

        {/* VIEW 2: AI SEMANTIC RAG SEARCH */}
        {activeTab === 'search' && (
          <AISchemeSearch
            citizenProfile={profile}
            onSelectScheme={(scheme) => {
              setSelectedSchemeDetail(scheme);
              setActiveTab('copilot');
            }}
          />
        )}

        {/* VIEW 3: DOCUMENT READINESS CHECKER (MODULE 7) */}
        {activeTab === 'documents' && (
          <DocumentReadinessChecker
            schemes={schemes}
            initialScheme={selectedSchemeDetail}
            citizenProfile={profile}
          />
        )}

        {/* VIEW 4: APPLICATION COPILOT (MODULE 8) */}
        {activeTab === 'copilot' && (
          <ApplicationCopilot
            schemes={schemes}
            initialScheme={selectedSchemeDetail}
            onNavigateDocuments={() => setActiveTab('documents')}
          />
        )}

        {/* VIEW 5: PROFILE WIZARD */}
        {activeTab === 'wizard' && (
          <div className="space-y-6">
            <ProfileWizard
              profile={profile}
              setProfile={setProfile}
              initialStep={wizardStep}
              onComplete={handleWizardComplete}
            />
          </div>
        )}

        {/* VIEW 6: CITIZEN PASSPORT / SUMMARY */}
        {activeTab === 'passport' && (
          <div className="space-y-6">
            <ProfileSummary
              profile={profile}
              normalizedProfile={normalizedProfile}
              onEditStep={handleEditStep}
              onProceedToEligibility={handleRunEvaluation}
            />
          </div>
        )}

        {/* VIEW 7: EXPLORE SCHEMES */}
        {activeTab === 'explore' && (
          <div className="space-y-6">
            {/* Search & Category Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search schemes by name, keyword, or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition"
                />
              </div>

              {/* Fast Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                {(schemes.length > 0
                  ? ['All', ...Array.from(new Set(schemes.map((s) => s.category).filter(Boolean)))]
                  : DEFAULT_CATEGORIES
                ).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      selectedCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Scheme Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSchemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/40 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {scheme.category}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{scheme.state || 'All India'}</span>
                    </div>

                    <h3 className="font-bold text-base text-white hover:text-emerald-300 transition">
                      {scheme.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {scheme.description}
                    </p>

                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-emerald-300 font-semibold flex items-start gap-2">
                      <IndianRupee className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{scheme.benefits || 'Direct Financial / In-Kind Assistance'}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedSchemeDetail(scheme);
                        setActiveTab('copilot');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-emerald-400 transition text-center"
                    >
                      Application Guide
                    </button>
                    <a
                      href={scheme.official_source}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition shadow-sm"
                    >
                      Portal <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Global Trust & Compliance Footer (Task 3) */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>CivicAid AI • Grounded Citizen Welfare Navigator</span>
        </div>
        <p className="max-w-3xl mx-auto px-4 text-[11px] text-slate-500 leading-relaxed">
          "Based on available scheme information. This tool provides informational guidance and does not guarantee eligibility or approval. All official welfare applications must be submitted directly through designated government portals (.gov.in / .nic.in)."
        </p>
      </footer>
    </div>
  );
}
