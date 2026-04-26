'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Wifi } from 'lucide-react';

interface SensorCardProps {
  label: string;
  value: number | string;
  unit: string;
  sensorType: 'flood' | 'pressure' | 'gas' | 'flow';
  trend?: 'up' | 'down' | 'stable';
  status?: 'normal' | 'warning' | 'critical';
  location?: string;
  lastUpdated?: string;
}

const typeConfig = {
  flood:    { emoji: '🌊', gradient: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300', glow: 'glow-blue' },
  pressure: { emoji: '⚡', gradient: 'from-violet-500/20 to-purple-500/10', border: 'border-violet-500/30', badge: 'bg-violet-500/20 text-violet-300', glow: '' },
  gas:      { emoji: '💨', gradient: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300', glow: '' },
  flow:     { emoji: '🔵', gradient: 'from-teal-500/20 to-emerald-500/10', border: 'border-teal-500/30', badge: 'bg-teal-500/20 text-teal-300', glow: 'glow-teal' },
};

const statusColors = {
  normal:   'text-emerald-400',
  warning:  'text-amber-400',
  critical: 'text-red-400',
};

export function SensorCard({
  label, value, unit, sensorType,
  trend = 'stable', status = 'normal',
  location, lastUpdated
}: SensorCardProps) {
  const cfg = typeConfig[sensorType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl border ${cfg.border} bg-gradient-to-br ${cfg.gradient} glass p-6 cursor-default`}
    >
      {/* Live ping */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-slate-500">
        <Wifi className="h-3.5 w-3.5" />
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">{cfg.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0.5">{sensorType}</p>
          <p className="text-sm font-medium text-slate-200 truncate">{label}</p>
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-2 mb-3">
        <span className={`text-3xl font-bold tabular-nums ${statusColors[status]}`}>{value}</span>
        <span className="text-sm text-slate-500 mb-1">{unit}</span>
        <span className="ml-auto">
          {trend === 'up'     && <TrendingUp className="h-5 w-5 text-red-400" />}
          {trend === 'down'   && <TrendingDown className="h-5 w-5 text-emerald-400" />}
          {trend === 'stable' && <Minus className="h-5 w-5 text-slate-500" />}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {location && <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${cfg.badge}`}>{location}</span>}
        {status === 'critical' && (
          <span className="text-xs text-red-400 font-semibold animate-pulse">⚠ CRITICAL</span>
        )}
        {lastUpdated && <span className="text-xs text-slate-600 ml-auto">{lastUpdated}</span>}
      </div>
    </motion.div>
  );
}
