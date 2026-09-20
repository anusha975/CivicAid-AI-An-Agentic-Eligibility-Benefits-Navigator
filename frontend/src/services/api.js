/**
 * CivicAid AI - Backend API Integration Service
 * High-performance client with in-memory caching and safe error handling.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// In-memory cache for schemes to eliminate redundant network roundtrips
let cachedSchemes = null;
let cachedSchemesTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute TTL

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend connection issue:', err.message);
    return { status: 'offline', error: err.message };
  }
}

export async function fetchSchemes(category = '', search = '', forceRefresh = false) {
  try {
    // Return cached data if available and no specific query/category filter
    if (!category && !search && !forceRefresh && cachedSchemes && (Date.now() - cachedSchemesTimestamp < CACHE_TTL_MS)) {
      return cachedSchemes;
    }

    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);

    const url = `${API_BASE}/api/v1/schemes${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!category && !search) {
      cachedSchemes = data;
      cachedSchemesTimestamp = Date.now();
    }
    return data;
  } catch (err) {
    console.error('Failed to fetch schemes:', err);
    // If network fails but we have stale cache, return stale cache as fallback
    if (cachedSchemes) return cachedSchemes;
    throw err;
  }
}

export async function evaluateCitizenEligibility(profile) {
  try {
    const res = await fetch(`${API_BASE}/api/schemes/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: profile || {} }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Eligibility evaluation failed:', err);
    throw err;
  }
}

export async function searchSchemes(query, profile = null, topK = 6) {
  try {
    const safeQuery = (query || '').trim();
    const res = await fetch(`${API_BASE}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: safeQuery, profile, top_k: topK }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('AI Scheme Search failed:', err);
    throw err;
  }
}

export async function analyzeWithAgents(profile = {}, query = '') {
  try {
    const res = await fetch(`${API_BASE}/api/agent/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: profile || {}, query: (query || '').trim() }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Multi-Agent Analysis failed:', err);
    throw err;
  }
}

export async function analyzeDocument(file, schemeId = null, requiredDocs = []) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (schemeId) {
      formData.append('scheme_id', schemeId);
    }
    if (requiredDocs && requiredDocs.length > 0) {
      formData.append('required_documents', requiredDocs.join(','));
    }

    const res = await fetch(`${API_BASE}/api/documents/analyze`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error('Document analysis failed:', err);
    throw err;
  }
}

export async function fetchSchemeApplicationGuide(schemeId) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/schemes/${schemeId}/application-guide`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch scheme application guide:', err);
    throw err;
  }
}
