"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
import {
  Command, Activity, Brain, FileText, Users,
  Shield, Wifi, WifiOff, ChevronRight, Droplets,
  AlertTriangle, Settings, LogOut,
  ExternalLink, Maximize2, RefreshCw, Menu, X,
  MapPin, Camera, UploadCloud, AlertCircle,
  Terminal, Download, Trash2, Bell, Key, User, Save
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    id: 'command',
    label: 'BWSSB Command Center',
    icon: Command,
    badge: 'LIVE',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'citizen',
    label: 'Citizen Portal',
    icon: Users,
    badge: null,
    badgeColor: '',
  },
  {
    id: 'predictive',
    label: 'Predictive Analytics',
    icon: Brain,
    badge: 'CNN/RUL',
    badgeColor: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  },
  {
    id: 'logs',
    label: 'System Logs',
    icon: FileText,
    badge: null,
    badgeColor: '',
  },
];

const STREAMLIT_URL_BASE = 'http://localhost:8501/';

// ── View Components ────────────────────────────────────────────────────────

// 1. Citizen Portal View
function CitizenPortalView() {
  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#080D14]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Citizen Reporting Portal</h2>
          <p className="text-slate-400">Log local water issues, pipe bursts, or anomalies for BWSSB review.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0B1120] border border-slate-800/60 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> New Report
            </h3>
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Issue Type</label>
                <select className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors">
                  <option>Major Pipe Burst</option>
                  <option>Minor Leakage</option>
                  <option>Water Contamination</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" placeholder="Enter ward or street name..." className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors" />
                </div>
              </div>
              <button type="button" className="w-full py-3 mt-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-2">
                <Camera className="w-4 h-4" /> Upload Photo Evidence
              </button>
              <button type="submit" className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#080D14] font-bold transition-colors shadow-lg shadow-cyan-500/25">
                Submit Report
              </button>
            </form>
          </div>

          <div className="bg-[#0B1120] border border-slate-800/60 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Local Issues</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60 flex items-start gap-4 hover:border-slate-700 transition-colors">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-400 shrink-0">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Pipe Leak - Sector {item * 3}</h4>
                    <p className="text-xs text-slate-500 mt-1">Reported 2 hours ago • Pending Verification</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. Predictive Analytics View
function PredictiveAnalyticsView() {
  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#080D14]">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Predictive AI Engine</h2>
          <p className="text-slate-400">Run TensorFlow.js models for crack detection and calculate Remaining Useful Life (RUL).</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0B1120] border border-slate-800/60 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-violet-400 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5" /> CNN Crack Detection
            </h3>
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer">
              <UploadCloud className="w-10 h-10 text-slate-500 mb-3" />
              <p className="text-slate-300 font-medium">Drag & drop pipe inspection imagery</p>
              <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, or Live Camera Feed</p>
              <button className="mt-4 px-6 py-2 rounded-lg bg-violet-500/20 text-violet-300 font-medium text-sm hover:bg-violet-500/30 transition-colors">
                Select Files
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#0B1120] border border-slate-800/60 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-semibold text-slate-400 mb-1">Avg. Network RUL</h3>
              <p className="text-3xl font-bold text-white">4.2 <span className="text-lg text-slate-500">Years</span></p>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-4">
                <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div className="bg-[#0B1120] border border-slate-800/60 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-semibold text-slate-400 mb-1">High Risk Pipes</h3>
              <p className="text-3xl font-bold text-red-400">12</p>
              <p className="text-xs text-slate-500 mt-2">Require immediate maintenance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. System Logs View
function SystemLogsView() {
  const dummyLogs = [
    { time: '04:12:33.041', level: 'INFO', source: 'websocket', msg: 'Connected to Streamlit engine on port 8501' },
    { time: '04:14:05.112', level: 'WARN', source: 'sensor_net', msg: 'Node W71-A experiencing high latency (>500ms)' },
    { time: '04:15:19.883', level: 'ERROR', source: 'cnn_model', msg: 'Inference failed: Corrupted image payload received' },
    { time: '04:16:01.002', level: 'INFO', source: 'auth_service', msg: 'JWT token refreshed for session_id: a9b4...' },
    { time: '04:18:22.451', level: 'INFO', source: 'database', msg: 'Supabase realtime channel [public:reports] subscribed' },
    { time: '04:20:11.933', level: 'WARN', source: 'pressure_sys', msg: 'Anomaly detected: Pressure drop of 15% in Sector 4' },
  ];

  return (
    <div className="flex-1 flex flex-col p-6 bg-[#080D14] overflow-hidden">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" /> Server Logs
          </h2>
          <p className="text-xs text-slate-500 mt-1">Real-time system events and error tracing</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors border border-slate-700">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors border border-red-500/20">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#05080C] border border-slate-800 rounded-xl p-4 overflow-y-auto font-mono text-[13px] shadow-inner">
        <div className="space-y-2">
          {dummyLogs.map((log, i) => (
            <div key={i} className="flex items-start gap-4 hover:bg-slate-900/50 p-1 rounded transition-colors">
              <span className="text-slate-500 shrink-0">[{log.time}]</span>
              <span className={`w-12 shrink-0 font-bold ${log.level === 'INFO' ? 'text-emerald-400' :
                  log.level === 'WARN' ? 'text-amber-400' :
                    'text-red-400'
                }`}>
                {log.level}
              </span>
              <span className="text-cyan-500/70 shrink-0 w-24">[{log.source}]</span>
              <span className="text-slate-300 break-all">{log.msg}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-slate-500 mt-4 animate-pulse">
            <span className="w-2 h-4 bg-cyan-400 block" /> Waiting for new events...
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. Settings View
function SettingsView() {
  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#080D14]">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Platform Settings</h2>
          <p className="text-slate-400">Configure command center thresholds, API keys, and notification preferences.</p>
        </div>

        {/* Section 1 */}
        <div className="bg-[#0B1120] border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-900/50 border-b border-slate-800/60 flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-slate-200">Alert Thresholds</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">Critical Water Loss (L/day)</p>
                <p className="text-xs text-slate-500">Trigger alert when estimated loss exceeds value</p>
              </div>
              <input type="number" defaultValue="40000" className="w-32 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 text-right focus:outline-none focus:border-cyan-500" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">AI Confidence Threshold</p>
                <p className="text-xs text-slate-500">Minimum CNN certainty to flag a leak</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="range" min="50" max="99" defaultValue="85" className="w-32 accent-cyan-500" />
                <span className="text-xs text-slate-400 w-8">85%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-[#0B1120] border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-900/50 border-b border-slate-800/60 flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-slate-200">API Integrations</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Supabase Project URL</label>
              <input type="text" defaultValue="https://xyz.supabase.co" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-slate-300 focus:outline-none focus:border-cyan-500 font-mono text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Streamlit Engine Endpoint</label>
              <input type="text" defaultValue="http://localhost:8501" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-slate-300 focus:outline-none focus:border-cyan-500 font-mono text-sm" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#080D14] font-bold transition-colors shadow-lg shadow-cyan-500/25 flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard Component ───────────────────────────────────────────────
export default function AquaGuardianDashboard() {
  const [activeNav, setActiveNav] = useState('command');
  const [iframeKey, setIframeKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const initAuth = async () => {
      const { supabase } = await import('@/lib/supabase');
      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => subscription.unsubscribe();
    };

    initAuth();
  }, []);

  const refreshIframe = () => {
    setIframeKey((k) => k + 1);
    setIsOnline(false);
    setTimeout(() => setIsOnline(true), 1000);
  };

  const streamlitUrl = session
    ? `${STREAMLIT_URL_BASE}?embedded=true&token=${session.access_token}`
    : `${STREAMLIT_URL_BASE}?embedded=true`;

  if (!mounted) return null;

  // Render logic based on activeNav
  const renderMainContent = () => {
    switch (activeNav) {
      case 'citizen':
        return <CitizenPortalView />;
      case 'predictive':
        return <PredictiveAnalyticsView />;
      case 'logs':
        return <SystemLogsView />;
      case 'settings':
        return <SettingsView />;
      case 'command':
      default:
        return (
          <div className="flex-1 relative overflow-hidden bg-[#080D14]">
            <iframe
              key={iframeKey}
              src={streamlitUrl}
              title="AquaGuardian Analytics Engine"
              className="absolute inset-0 w-full h-full border-none"
              allow="geolocation; microphone; camera; clipboard-read; clipboard-write; fullscreen"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
            />
            {!isOnline && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#080D14]/90 backdrop-blur-md">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400 mb-4" />
                <p className="text-slate-300 font-medium tracking-wide">
                  Syncing with Analytics Engine...
                </p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#080D14] overflow-hidden font-sans">
      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside className={`relative z-20 flex flex-col shrink-0 transition-all duration-300 ease-in-out bg-[#0B1120] border-r border-slate-800/60 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800/60 shrink-0">
          <div className="relative flex-shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#0B1120] animate-pulse" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white leading-tight">AquaGuardian</p>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Enterprise v2.1</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors">
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon, badge, badgeColor }) => {
            const isActive = activeNav === id;
            return (
              <button
                key={id}
                onClick={() => setActiveNav(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group relative ${isActive ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-sm shadow-cyan-500/10' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}`}
              >
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-400 rounded-r-full" />}
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-sm font-medium leading-tight">{label}</span>
                    {badge && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${badgeColor}`}>{badge}</span>}
                    {isActive && <ChevronRight className="h-3 w-3 text-cyan-400/60" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/60 space-y-1 shrink-0">
          <button
            onClick={() => setActiveNav('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group border border-transparent ${activeNav === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
          >
            <Settings className="h-4 w-4 flex-shrink-0 group-hover:rotate-45 transition-transform duration-300" />
            {sidebarOpen && <span className="text-sm font-medium">Settings</span>}
          </button>
          <Link href="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all group border border-transparent">
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Exit Dashboard</span>}
          </Link>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3.5 bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-800/60 shrink-0 z-10">
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              AquaGuardian Enterprise <span className="ml-2 text-slate-500 font-normal text-sm">—</span> <span className="ml-2 text-cyan-400 font-semibold text-sm">Bengaluru Ward 71</span>
            </h1>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">BWSSB Command Center · FusionX 2026 · Problem #51</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" /> 3 Active Alerts
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold tracking-wide ${isOnline ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              {isOnline ? <><Wifi className="h-3.5 w-3.5" /><span>Live Status: ONLINE</span></> : <><WifiOff className="h-3.5 w-3.5" /><span>Engine Offline</span></>}
            </div>
            <div className="flex items-center gap-1.5 ml-1">
              <button onClick={refreshIframe} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-cyan-400 transition-all"><RefreshCw className="h-4 w-4" /></button>
              <button onClick={() => window.open(streamlitUrl, '_blank')} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-cyan-400 transition-all"><ExternalLink className="h-4 w-4" /></button>
              <button onClick={() => document.documentElement.requestFullscreen()} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-cyan-400 transition-all"><Maximize2 className="h-4 w-4" /></button>
            </div>
          </div>
        </header>

        <div className="flex items-center gap-4 px-6 py-2 bg-slate-900/60 border-b border-slate-800/40 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Activity className="h-3 w-3 text-emerald-400" />
            <span>AI Inference Engine</span>
            <span className="text-slate-700">·</span>
            <span className="text-emerald-400 font-medium">Port 8501</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700/50">
              <Shield className="h-2.5 w-2.5 text-cyan-500" /> JWT Auth Secured
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700/50">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" /> Realtime WebSocket
            </span>
          </div>
        </div>

        {/* Dynamic Content Rendering Here */}
        {renderMainContent()}

      </div>
    </div>
  );
}