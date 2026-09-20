/**
 * CivicAid AI - Backend API Integration Service
 * High-performance client with dynamic runtime URL resolution, in-memory caching, and resilient offline fallback.
 */

import fallbackSchemes from '../data/schemesData.json';

const STORAGE_KEY_API_URL = 'CIVICAID_API_URL';

/**
 * Resolves the active backend API base URL.
 * Priority order:
 * 1. Runtime override in localStorage (configured via UI modal)
 * 2. Vite build-time environment variable (VITE_API_URL)
 * 3. Default local development server (http://127.0.0.1:8000)
 */
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(STORAGE_KEY_API_URL);
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return 'http://127.0.0.1:8000';
}

/**
 * Updates the runtime backend API base URL and clears caches.
 */
export function setApiBaseUrl(url) {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem(STORAGE_KEY_API_URL);
    } else {
      const cleanUrl = url.trim().replace(/\/+$/, '');
      localStorage.setItem(STORAGE_KEY_API_URL, cleanUrl);
    }
    cachedSchemes = null;
    cachedSchemesTimestamp = 0;
  }
}

// In-memory cache for schemes to eliminate redundant network roundtrips
let cachedSchemes = null;
let cachedSchemesTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute TTL

/**
 * Verifies connectivity with the backend server.
 */
export async function checkBackendHealth(customBaseUrl = null) {
  const base = (customBaseUrl || getApiBaseUrl()).replace(/\/+$/, '');
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(`${base}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      // Fallback check on root /
      const rootRes = await fetch(`${base}/`, { signal: controller.signal });
      if (rootRes.ok) {
        const rootData = await rootRes.json();
        return {
          status: 'online',
          version: rootData.version || '1.0.0',
          environment: rootData.environment || 'production',
          latencyMs: Date.now() - startTime,
          url: base
        };
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      status: 'online',
      version: data.version || '1.0.0',
      environment: data.environment || 'production',
      database: data.database || 'ready',
      knowledge_base_schemes: data.knowledge_base_schemes || 26,
      latencyMs: Date.now() - startTime,
      url: base
    };
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    console.warn(`Backend connection failed at ${base}:`, err.message);
    return {
      status: 'offline',
      isTimeout,
      error: isTimeout ? 'Connection timed out (backend may be sleeping on Render free tier)' : err.message,
      url: base,
      latencyMs: Date.now() - startTime
    };
  }
}

/**
 * Fetches all welfare schemes, with seamless fallback to embedded verified dataset if server is sleeping.
 */
export async function fetchSchemes(category = '', search = '', forceRefresh = false) {
  const base = getApiBaseUrl();

  try {
    if (!category && !search && !forceRefresh && cachedSchemes && (Date.now() - cachedSchemesTimestamp < CACHE_TTL_MS)) {
      return cachedSchemes;
    }

    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);

    const url = `${base}/api/v1/schemes${params.toString() ? `?${params.toString()}` : ''}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!category && !search) {
      cachedSchemes = data;
      cachedSchemesTimestamp = Date.now();
    }
    return data;
  } catch (err) {
    console.warn('Network scheme fetch failed, serving from local verified knowledge cache:', err.message);
    
    // Fallback: Return locally bundled scheme dataset with client-side filtering
    let filtered = Array.isArray(fallbackSchemes) ? fallbackSchemes : [];
    if (category && category !== 'All') {
      filtered = filtered.filter(s => s.category?.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        (s.tags && s.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return filtered;
  }
}

/**
 * Evaluates citizen eligibility via backend engine or local rules fallback.
 */
export async function evaluateCitizenEligibility(profile) {
  const base = getApiBaseUrl();

  try {
    const res = await fetch(`${base}/api/schemes/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: profile || {} }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Eligibility evaluation failed over network:', err);
    throw err;
  }
}

/**
 * Searches schemes using local RAG semantic search or smart client-side keyword fallback.
 */
export async function searchSchemes(query, profile = null, topK = 6) {
  const base = getApiBaseUrl();
  const safeQuery = (query || '').trim();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${base}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: safeQuery, profile, top_k: topK }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend search unreachable, running local client-side fallback matching:', err.message);
    
    // Client-side grounded fallback matching over fallbackSchemes
    const qTokens = safeQuery.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scored = (fallbackSchemes || []).map(scheme => {
      let score = 0.2;
      const text = `${scheme.name} ${scheme.description} ${scheme.category} ${scheme.target_beneficiaries?.join(' ')} ${(scheme.tags || []).join(' ')} ${scheme.benefits}`.toLowerCase();
      
      qTokens.forEach(t => {
        if (text.includes(t)) score += 0.15;
      });

      // Boost if state or occupation matches profile
      if (profile) {
        if (profile.occupation && text.includes(profile.occupation.toLowerCase())) score += 0.25;
        if (profile.state && (scheme.state === 'All India' || scheme.state?.toLowerCase() === profile.state.toLowerCase())) score += 0.15;
      }

      const matchPct = Math.min(0.96, Math.max(0.45, score));
      return {
        scheme,
        relevance_score: matchPct,
        evidence: `Direct match from verified official scheme specifications: ${scheme.description.slice(0, 160)}...`,
        matched_rules: [
          `Category: ${scheme.category}`,
          `Target: ${(scheme.target_beneficiaries || [])[0] || 'Eligible Citizens'}`,
          `State: ${scheme.state || 'All India'}`
        ],
        source: scheme.official_source || scheme.source_name || 'Official Government Portal'
      };
    });

    scored.sort((a, b) => b.relevance_score - a.relevance_score);
    const results = scored.slice(0, topK);

    return {
      query: safeQuery,
      total_results: results.length,
      results,
      is_fallback: true,
      note: 'Retrieved via local grounded scheme catalog while backend connection is establishing.'
    };
  }
}

/**
 * Runs 5-agent pipeline analysis.
 */
export async function analyzeWithAgents(profile = {}, query = '') {
  const base = getApiBaseUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${base}/api/agent/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: profile || {}, query: (query || '').trim() }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Multi-Agent Analysis failed:', err);
    throw err;
  }
}

/**
 * Analyzes uploaded document structure and checks against scheme requirements.
 */
export async function analyzeDocument(file, schemeId = null, requiredDocs = []) {
  const base = getApiBaseUrl();

  try {
    const formData = new FormData();
    formData.append('file', file);
    if (schemeId) {
      formData.append('scheme_id', schemeId);
    }
    if (requiredDocs && requiredDocs.length > 0) {
      formData.append('required_documents', requiredDocs.join(','));
    }

    const res = await fetch(`${base}/api/documents/analyze`, {
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

/**
 * Fetches step-by-step application guide for a scheme.
 */
export async function fetchSchemeApplicationGuide(schemeId) {
  const base = getApiBaseUrl();

  try {
    const res = await fetch(`${base}/api/v1/schemes/${schemeId}/application-guide`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch scheme application guide:', err);
    throw err;
  }
}
