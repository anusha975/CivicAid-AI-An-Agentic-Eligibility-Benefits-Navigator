import React, { useState, useEffect } from 'react';
import {
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Save,
  RotateCcw,
  X,
  Zap,
  Info,
  Globe,
  Radio
} from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, checkBackendHealth } from '../services/api';

export default function BackendConnectorModal({ isOpen, onClose, onConnected }) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [checking, setChecking] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const activeUrl = getApiBaseUrl();
      setCurrentUrl(activeUrl);
      setInputUrl(activeUrl);
      testConnection(activeUrl);
    }
  }, [isOpen]);

  const testConnection = async (urlToTest) => {
    setChecking(true);
    setHealthStatus(null);
    setSavedSuccess(false);

    const target = urlToTest || inputUrl || getApiBaseUrl();
    const result = await checkBackendHealth(target);
    setHealthStatus(result);
    setChecking(false);
  };

  const handleSave = async () => {
    const cleanUrl = inputUrl.trim().replace(/\/+$/, '');
    setApiBaseUrl(cleanUrl);
    setCurrentUrl(cleanUrl || 'http://127.0.0.1:8000');
    setSavedSuccess(true);
    
    // Re-verify with saved URL
    await testConnection(cleanUrl);
    
    if (onConnected) {
      onConnected(cleanUrl);
    }

    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  const handleReset = () => {
    setApiBaseUrl('');
    const defaultUrl = 'http://127.0.0.1:8000';
    setInputUrl(defaultUrl);
    setCurrentUrl(defaultUrl);
    testConnection(defaultUrl);
    if (onConnected) {
      onConnected(defaultUrl);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Backend Server Connector</h3>
              <p className="text-xs text-slate-400">Configure & test FastAPI live backend connection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Indicator Box */}
        <div className={`p-4 rounded-xl border transition-all ${
          healthStatus?.status === 'online'
            ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
            : checking
            ? 'bg-slate-950/60 border-slate-800 text-slate-300'
            : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {checking ? (
                <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin shrink-0 mt-0.5" />
              ) : healthStatus?.status === 'online' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <span>Backend Status: {checking ? 'Pinging Server...' : healthStatus?.status === 'online' ? 'Connected & Healthy' : 'Disconnected / Sleep Mode'}</span>
                  {healthStatus?.status === 'online' && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      {healthStatus.latencyMs}ms
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-90 leading-relaxed font-mono">
                  {checking
                    ? `Testing connection to: ${inputUrl || currentUrl}...`
                    : healthStatus?.status === 'online'
                    ? `API v${healthStatus.version} • Schemes: ${healthStatus.knowledge_base_schemes || 26} loaded • Env: ${healthStatus.environment}`
                    : healthStatus?.error || 'Unable to reach backend server. Render free instances sleep after inactivity.'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => testConnection(inputUrl)}
              disabled={checking}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition shrink-0 disabled:opacity-50"
              title="Re-test Connection"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Ping</span>
            </button>
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Backend API Base URL:
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="e.g. https://civicaid-ai-backend.onrender.com or http://127.0.0.1:8000"
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition"
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Enter your Render Web Service URL (e.g. <span className="text-emerald-400 font-mono">https://&lt;service-name&gt;.onrender.com</span>) to connect your live frontend without rebuilding.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset to Local</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={checking}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" /> Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save & Connect
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Help Tip */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-cyan-400" /> Tip for Render Deployments:
          </div>
          <p>
            Render free web services automatically spin down after 15 minutes of inactivity. When accessed again, the first request may take 30–50 seconds to wake up the instance.
          </p>
        </div>
      </div>
    </div>
  );
}
