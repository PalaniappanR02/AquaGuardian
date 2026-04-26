'use client';

import { useEffect, useState } from 'react';
import { supabase, type SensorData } from '@/lib/supabase';
import { SensorCard } from '@/components/SensorCard';
import { motion } from 'framer-motion';
import {
  Activity, AlertTriangle, CheckCircle, Cpu,
  Droplets, Zap, Wind, BarChart3
} from 'lucide-react';
import Link from 'next/link';

const kpiData = [
  { label: 'Total Sensors Online', value: '128', icon: Activity, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
  { label: 'Active Alerts', value: '3', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { label: 'Infrastructure Health', value: '94.2%', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { label: 'AI Models Active', value: '6', icon: Cpu, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
];

export default function HomePage() {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [complaints, setComplaints] = useState<number>(0);

  useEffect(() => {
    // Initial fetch
    supabase.from('sensor_data').select('*').order('timestamp', { ascending: false }).limit(6)
      .then(({ data }) => setSensors(data || []));
    supabase.from('complaints').select('id', { count: 'exact', head: true })
      .then(({ count }) => setComplaints(count || 0));

    // Realtime subscription
    const channel = supabase.channel('sensor_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_data' },
        payload => setSensors(prev => [payload.new as SensorData, ...prev.slice(0, 5)]))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-950/50 via-slate-950 to-cyan-950/30 pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase tracking-widest mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
              Live Digital Twin Platform
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              <span className="gradient-text">AquaGuardian</span>{' '}
              <span className="text-white">Platform</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Enterprise-grade IoT monitoring, AI-driven predictive analytics, and real-time pipeline
              management for next-generation urban infrastructure.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/dashboard"
                className="px-8 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-xl shadow-sky-500/30 hover:shadow-sky-500/50 hover:from-sky-400 hover:to-cyan-400 transition-all text-sm">
                Open Digital Twin →
              </Link>
              <Link href="/history"
                className="px-8 py-3.5 rounded-xl font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm">
                View Sensor Logs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* KPI Strip */}
      <section className="border-y border-slate-800 bg-slate-900/50 py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiData.map(({ label, value, icon: Icon, color, bg }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-4 p-4 rounded-xl border ${bg}`}>
              <div className={`p-2 rounded-lg bg-slate-900/50`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Live Sensor Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Live Sensor Telemetry</h2>
              <p className="text-sm text-slate-400">Real-time IoT data streams from K-100 waterway network</p>
            </div>
            <Link href="/history"
              className="flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300 transition-colors">
              <BarChart3 className="h-4 w-4" /> View All Logs
            </Link>
          </div>

          {sensors.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Placeholder cards with simulated data */}
              {[
                { label: 'K-100 East Flood Sensor', value: 2.45, unit: 'm', sensorType: 'flood' as const, trend: 'stable' as const, status: 'normal' as const, location: 'K100-EAST' },
                { label: 'K-100 West Flood Sensor', value: 1.90, unit: 'm', sensorType: 'flood' as const, trend: 'down' as const, status: 'normal' as const, location: 'K100-WEST' },
                { label: 'Zone A Pressure', value: 98.7, unit: 'PSI', sensorType: 'pressure' as const, trend: 'stable' as const, status: 'normal' as const, location: 'ZONE-A' },
                { label: 'Zone B Pressure', value: 102.3, unit: 'PSI', sensorType: 'pressure' as const, trend: 'up' as const, status: 'warning' as const, location: 'ZONE-B' },
                { label: 'Sector 7 Gas Monitor', value: 0.02, unit: 'ppm', sensorType: 'gas' as const, trend: 'stable' as const, status: 'normal' as const, location: 'SECTOR-7' },
                { label: 'Main Distribution Flow', value: 450.5, unit: 'L/min', sensorType: 'flow' as const, trend: 'down' as const, status: 'normal' as const, location: 'MAIN-DIST' },
              ].map(s => <SensorCard key={s.label} {...s} lastUpdated="just now" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sensors.map(s => (
                <SensorCard key={s.id} label={s.sensor_id} value={s.value} unit={s.unit}
                  sensorType={s.sensor_type} location={s.location_id}
                  lastUpdated={new Date(s.timestamp).toLocaleTimeString()} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick Access Grid */}
      <section className="pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Operational Modules</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { href: '/dashboard', icon: '🌊', title: 'Flood Monitor', desc: 'K-100 Waterway' },
              { href: '/dashboard', icon: '⚡', title: 'Pressure Analysis', desc: 'Fiber-Optic Sensors' },
              { href: '/dashboard', icon: '💨', title: 'Gas Detection', desc: 'Methane & CO₂' },
              { href: '/dashboard', icon: '🔵', title: 'Flow Distribution', desc: 'City Water Grid' },
              { href: '/dashboard', icon: '🔍', title: 'Crack Detection', desc: 'CNN AI Vision' },
              { href: '/dashboard', icon: '⏳', title: 'RUL Prediction', desc: 'Arrhenius Model' },
              { href: '/upload', icon: '📁', title: 'Upload Data', desc: 'Pipe Inspection' },
              { href: '/complaints', icon: '📋', title: 'Complaints', desc: `${complaints} Active` },
            ].map(({ href, icon, title, desc }) => (
              <Link key={title} href={href}
                className="flex flex-col items-center text-center p-6 rounded-2xl border border-slate-700/50 bg-slate-900/50 hover:bg-slate-800/60 hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/10 transition-all group">
                <span className="text-3xl mb-3">{icon}</span>
                <p className="font-semibold text-slate-200 text-sm group-hover:text-sky-400 transition-colors">{title}</p>
                <p className="text-xs text-slate-500 mt-1">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
