import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'AquaGuardian Platform',
  description: 'Enterprise-grade Smart City Digital Twin Engine for intelligent urban infrastructure management',
  keywords: 'smart city, IoT, digital twin, infrastructure monitoring, AI analytics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-slate-950 text-slate-100 antialiased`}>
        {/* Top announcement banner */}
        <div className="w-full bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-500 py-1.5 text-center text-xs font-semibold text-white tracking-wide">
          🌐 AquaGuardian Platform — Live Telemetry &amp; Digital Twin Engine &nbsp;|&nbsp; K-100 Waterway Monitoring Active
        </div>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-sm text-slate-500">
          <p>© 2026 AquaGuardian Platform. All rights reserved. | Powered by AI &amp; IoT</p>
        </footer>
      </body>
    </html>
  );
}
