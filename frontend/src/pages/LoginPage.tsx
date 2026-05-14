/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, Atom } from 'lucide-react';
import MicrochipCursor from '../components/cursor/MicrochipCursor';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-800 font-sans flex items-center justify-center relative overflow-hidden">
      <MicrochipCursor />
      
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-100/40 rounded-full blur-[120px]" />
        <div className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <div className="mb-10 text-center flex flex-col items-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="mb-6 text-emerald-500/80"
          >
             <Atom strokeWidth={1} className="w-24 h-24" />
          </motion.div>
          <h1 className="text-5xl font-black tracking-tight leading-none mb-1 flex flex-col items-center">
            <span className="text-[#0B1221]">FUSION</span>
            <span className="gradient-text-emerald">NEURAL</span>
          </h1>
          <p className="text-sm font-semibold tracking-widest uppercase text-slate-500 mt-4" style={{ letterSpacing: '0.15em' }}>
            Evolution from operator to director
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-sm text-center font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Identity</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:border-emerald-500 transition-all text-sm font-medium"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Passphrase</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:border-emerald-500 transition-all text-sm font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B1221] text-white font-bold tracking-wide rounded-2xl py-4 px-4 flex items-center justify-center gap-2 hover:bg-[#1a2333] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group mt-8 shadow-lg shadow-slate-900/10"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Authenticate <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="mt-8 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
          <p>Restricted access. Authorized personnel only.</p>
        </div>
      </motion.div>
    </div>
  );
}
