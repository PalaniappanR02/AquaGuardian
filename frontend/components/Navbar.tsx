'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard, History, Upload, MessageSquare, Info,
  LogOut, Menu, X, Radio, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '/', label: 'Overview', icon: Activity },
  { href: '/dashboard', label: 'Digital Twin', icon: LayoutDashboard },
  { href: '/history', label: 'Sensor Logs', icon: History },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/complaints', label: 'Complaints', icon: MessageSquare },
  { href: '/about', label: 'About', icon: Info },
];

export function Navbar() {
  const [session, setSession] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => { listener.subscription.unsubscribe(); window.removeEventListener('scroll', handleScroll); };
  }, []);

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-900/95 backdrop-blur-xl shadow-lg shadow-slate-950/50 border-b border-slate-800'
      : 'bg-slate-900/80 backdrop-blur-md border-b border-slate-800/50'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-white shadow-lg shadow-sky-500/25 group-hover:shadow-sky-500/50 transition-shadow">
              <img src="/aqualogo.jpeg.jpeg" alt="Logo" className="w-full h-full object-cover" />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              <span className="gradient-text">AquaGuardian</span>
              <span className="text-slate-400 font-normal text-sm ml-1">Platform</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active
                    ? 'bg-sky-500/15 text-sky-400 shadow-inner shadow-sky-500/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Auth + Mobile Toggle */}
          <div className="flex items-center gap-3">
            {session ? (
              <button onClick={handleSignOut}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            ) : (
              <Link href="/login"
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-400 hover:to-cyan-400 shadow-lg shadow-sky-500/25 transition-all">
                Sign In
              </Link>
            )}
            <button className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-slate-900 border-t border-slate-800 px-4 pb-4">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 py-3 text-sm font-medium border-b border-slate-800/50 ${pathname === href ? 'text-sky-400' : 'text-slate-400'
                  }`}>
                <Icon className="h-4 w-4" />{label}
              </Link>
            ))}
            {session
              ? <button onClick={handleSignOut} className="flex items-center gap-3 py-3 text-sm text-red-400 w-full"><LogOut className="h-4 w-4" /> Sign Out</button>
              : <Link href="/login" onClick={() => setMobileOpen(false)} className="block mt-3 px-4 py-2 bg-sky-500 text-white text-sm font-semibold rounded-lg text-center">Sign In</Link>
            }
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
