import { Radio, ShieldCheck } from 'lucide-react';

const cases = [
  { id: '01', title: 'Rain Water / Flood Management', tag: 'K-100 Waterway', desc: 'Real-time water level monitoring with critical threshold alerts and plotly live charts.' },
  { id: '02', title: 'Pressure & Heat Anomaly', tag: 'Fiber-Optic Sensors', desc: 'Moving average anomaly detection on dual-axis pressure/temperature time-series data.' },
  { id: '03', title: 'Water Flow & Distribution', tag: 'City Grid', desc: 'Flow rate monitoring across distribution zones with imbalance detection.' },
  { id: '04', title: 'Gas Leak Detection', tag: 'Methane / CO₂', desc: 'Chemical sensor threshold alerts with surge pattern detection.' },
  { id: '05', title: 'Pipeline Crack Analysis', tag: 'CNN + Logistic Regression', desc: 'VGG16 feature extraction + probabilistic classification for structural defects.' },
  { id: '06', title: 'Remaining Useful Life (RUL)', tag: 'Arrhenius Law', desc: 'Physics-informed decay model (A·e^(-Ea/RT)) and geospatial degradation heat-map.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 py-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-xl shadow-sky-500/30 mb-6">
            <Radio className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4">
            About <span className="gradient-text">AquaGuardian Enterprise</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            An enterprise-grade Smart City Digital Twin platform combining IoT telemetry,
            AI-driven predictive maintenance, and real-time infrastructure monitoring
            for next-generation urban management.
          </p>
        </div>

        {/* Operational Cases */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-white mb-6">Analytical Use Cases</h2>
          <div className="space-y-4">
            {cases.map(c => (
              <div key={c.id} className="glass rounded-2xl border border-slate-700/50 p-6 flex gap-5 hover:border-cyan-500/20 transition-colors">
                <span className="text-3xl font-black text-slate-700 font-mono shrink-0">{c.id}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-200">{c.title}</p>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-400 font-medium">{c.tag}</span>
                  </div>
                  <p className="text-sm text-slate-500">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture Note */}
        <section className="glass rounded-3xl border border-slate-700/50 p-8 text-center">
          <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-3">Enterprise Security Architecture</h3>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            All infrastructure data access is governed by strict Row Level Security (RLS). The unified auth flow
            creates a seamless, secure identity without requiring duplicate logins across the analytical engines.
            Sensitive operations are shielded from public access.
          </p>
        </section>
      </div>
    </div>
  );
}