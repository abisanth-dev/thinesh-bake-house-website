import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Logo from '../components/Logo';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message || 'Invalid email or password.');
      setLoading(false);
      return;
    }
    // On success, the auth listener in AdminApp will pick up the new session automatically.
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-stone-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-8 space-y-6"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo />
          <div className="flex items-center gap-2 bg-brand-gold/10 border border-brand-gold/30 text-brand-gold px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin Control Suite
          </div>
          <p className="text-stone-400 text-xs">Sign in with your Thinesh Bake House admin account</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@thinesh.lk"
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-stone-800 border border-stone-700 rounded-xl text-white placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-stone-800 border border-stone-700 rounded-xl text-white placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {loading ? 'Signing In...' : 'Sign In to Admin Panel'}
          </button>
        </form>

        <p className="text-center text-[11px] text-stone-500">
          Access is restricted to authorized Thinesh Bake House staff accounts.
        </p>
      </motion.div>
    </div>
  );
}
