'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Radio, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } }
      });
      if (error) setError(error.message);
      else setMessage('Check your email to confirm your account.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-sky-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass rounded-3xl border border-slate-700/50 p-8 shadow-2xl shadow-slate-950">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-xl shadow-sky-500/30 mb-4">
            <Radio className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            <span className="gradient-text">FusionX</span> Platform
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isSignUp ? 'Create your operator account' : 'Sign in to your control center'}
          </p>
        </div>

        {/* Error / Message */}
        {error && (
          <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}
        {message && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            ✅ {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Full Name</label>
              <Input placeholder="Dr. Rajesh Kumar" value={fullName} onChange={e => setFullName(e.target.value)} required={isSignUp} />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input className="pl-10" type="email" placeholder="operator@fusionx.city" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input className="pl-10 pr-10" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              <button type="button" onClick={() => setShowPassword(o => !o)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full mt-6" disabled={loading}>
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          {isSignUp ? 'Already have an account?' : 'New operator?'}{' '}
          <button onClick={() => { setIsSignUp(o => !o); setError(''); setMessage(''); }}
            className="text-sky-400 hover:text-sky-300 font-semibold transition-colors">
            {isSignUp ? 'Sign In' : 'Register'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
