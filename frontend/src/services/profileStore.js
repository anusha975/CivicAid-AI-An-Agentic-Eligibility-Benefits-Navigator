/**
 * CivicAid AI - ProfileStore
 * Handles multi-step form state, validation, completion percentage,
 * local draft caching, presets, and backend synchronization.
 */

const STORAGE_KEY = 'civicaid_citizen_profile_draft';
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const INITIAL_PROFILE = {
  state: 'Uttar Pradesh',
  district: 'Varanasi',
  age: 26,
  gender: 'Male',
  occupation: 'Farmer',
  education_level: 'Higher Secondary / 12th Pass',
  annual_family_income: 180000,
  social_category: 'OBC (Other Backward Classes)',
  disability_status: false,
  disability_percentage: null,
  area_type: 'Rural',
  employment_status: 'Agricultural Labor',
  special_circumstances: ['BPL Ration Card Holder'],
  goals: ['agriculture', 'financial assistance'],
};

export const PRESET_PROFILES = [
  {
    name: 'Ramesh Patel (Rural Farmer)',
    subtitle: 'Small landholder seeking crop subsidy & DBT',
    data: {
      state: 'Uttar Pradesh',
      district: 'Varanasi',
      age: 42,
      gender: 'Male',
      occupation: 'Farmer',
      education_level: 'Middle School (6th - 8th)',
      annual_family_income: 140000,
      social_category: 'OBC (Other Backward Classes)',
      disability_status: false,
      disability_percentage: null,
      area_type: 'Rural',
      employment_status: 'Agricultural Labor',
      special_circumstances: ['BPL Ration Card Holder', 'Small/Marginal Farmer'],
      goals: ['agriculture', 'financial assistance', 'healthcare'],
    }
  },
  {
    name: 'Pooja Sharma (Post-Matric Student)',
    subtitle: 'Undergraduate student seeking scholarship & skill aid',
    data: {
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      age: 20,
      gender: 'Female',
      occupation: 'Student',
      education_level: 'Higher Secondary / 12th Pass',
      annual_family_income: 220000,
      social_category: 'SC (Scheduled Caste)',
      disability_status: false,
      disability_percentage: null,
      area_type: 'Urban',
      employment_status: 'Student',
      special_circumstances: ['First Generation Learner'],
      goals: ['scholarship', 'education', 'employment'],
    }
  },
  {
    name: 'Meena Devi (Self-Help Group Artisan)',
    subtitle: 'Rural artisan seeking micro-credit & housing grant',
    data: {
      state: 'Rajasthan',
      district: 'Jaipur',
      age: 35,
      gender: 'Female',
      occupation: 'Entrepreneur',
      education_level: 'Primary (Up to 5th)',
      annual_family_income: 95000,
      social_category: 'ST (Scheduled Tribe)',
      disability_status: false,
      disability_percentage: null,
      area_type: 'Rural',
      employment_status: 'Self-Employed / Business',
      special_circumstances: ['Woman Head of Household', 'BPL Ration Card Holder'],
      goals: ['entrepreneurship', 'housing', 'healthcare', 'financial assistance'],
    }
  },
  {
    name: 'Anil Kumar (Informal Gig Worker)',
    subtitle: 'Urban delivery worker seeking health & pension safety net',
    data: {
      state: 'Maharashtra',
      district: 'Pune',
      age: 29,
      gender: 'Male',
      occupation: 'Working',
      education_level: 'Secondary / 10th Pass',
      annual_family_income: 260000,
      social_category: 'General',
      disability_status: false,
      disability_percentage: null,
      area_type: 'Urban',
      employment_status: 'Daily Wage / Casual Labor',
      special_circumstances: ['Gig / Platform Worker', 'Migrant Worker'],
      goals: ['healthcare', 'financial assistance', 'employment'],
    }
  }
];

export function getSavedDraftProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Could not read saved profile draft:', err);
  }
  return INITIAL_PROFILE;
}

export function saveDraftProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('Could not save draft profile to localStorage:', err);
  }
}

export function calculateCompletionPercentage(profile) {
  const fields = [
    Boolean(profile.state),
    Boolean(profile.district),
    profile.age !== undefined && profile.age !== null && profile.age >= 0,
    Boolean(profile.gender),
    Boolean(profile.occupation),
    Boolean(profile.education_level),
    profile.annual_family_income !== undefined && profile.annual_family_income >= 0,
    Boolean(profile.social_category),
    profile.disability_status !== undefined,
    Boolean(profile.area_type),
    Boolean(profile.employment_status),
    Array.isArray(profile.special_circumstances),
    Array.isArray(profile.goals) && profile.goals.length > 0,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

export function validateStep(stepIndex, profile) {
  const errors = {};

  if (stepIndex === 0) {
    // Step 0: Location & Living Environment
    if (!profile.state || profile.state.trim().length < 2) {
      errors.state = 'Please select your State or Union Territory';
    }
    if (!profile.district || profile.district.trim().length < 2) {
      errors.district = 'Please select or enter your District';
    }
    if (!profile.area_type) {
      errors.area_type = 'Please specify your area type (Rural/Urban/Semi-Urban)';
    }
  } else if (stepIndex === 1) {
    // Step 1: Demographics & Social Category
    if (profile.age === undefined || profile.age === null || isNaN(profile.age)) {
      errors.age = 'Please enter your age';
    } else if (profile.age < 0 || profile.age > 120) {
      errors.age = 'Age must be between 0 and 120 years';
    }
    if (!profile.gender) {
      errors.gender = 'Please select your gender';
    }
    if (!profile.social_category) {
      errors.social_category = 'Please choose your social category';
    }
    if (profile.disability_status && (profile.disability_percentage < 0 || profile.disability_percentage > 100)) {
      errors.disability_percentage = 'Disability percentage must be between 0 and 100%';
    }
  } else if (stepIndex === 2) {
    // Step 2: Occupation & Education
    if (!profile.occupation) {
      errors.occupation = 'Please select your primary occupation';
    }
    if (!profile.education_level) {
      errors.education_level = 'Please select your highest completed education level';
    }
    if (!profile.employment_status) {
      errors.employment_status = 'Please choose your employment status';
    }
  } else if (stepIndex === 3) {
    // Step 3: Household & Income
    if (profile.annual_family_income === undefined || isNaN(profile.annual_family_income)) {
      errors.annual_family_income = 'Please specify your household annual income';
    } else if (profile.annual_family_income < 0) {
      errors.annual_family_income = 'Income cannot be negative';
    }
  } else if (stepIndex === 4) {
    // Step 4: Welfare Goals
    if (!profile.goals || profile.goals.length === 0) {
      errors.goals = 'Please select at least one welfare goal or assistance area';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export async function saveProfileToServer(profile) {
  try {
    const res = await fetch(`${API_BASE}/api/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Server error (HTTP ${res.status})`);
    }
    return await res.json();
  } catch (err) {
    console.error('Failed to save profile to server:', err);
    throw err;
  }
}

export async function fetchProfileFromServer(profileId) {
  try {
    const res = await fetch(`${API_BASE}/api/profile/${profileId}`);
    if (!res.ok) throw new Error(`Profile not found (HTTP ${res.status})`);
    return await res.json();
  } catch (err) {
    console.error('Failed to retrieve profile from server:', err);
    throw err;
  }
}
