'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Landmark, Lock, Mail, AlertCircle, RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const u = await login(email, password);
      // Automatic role-based routing:
      if (u.role === 'borrower') {
        router.push('/borrower');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shadow-md">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#14243A]">
              Lend<span className="text-[#0F766E]">Flow</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-[#14243A]">Sign in to your Account</h2>
          <p className="mt-1 text-xs text-slate-500">
            Access your customer portal or employee operations workbench
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 focus:border-[#0F766E] text-slate-800 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 focus:border-[#0F766E] text-slate-800 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] text-white font-semibold text-xs transition shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-[#0F766E]/50 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Sign In</span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-500">Need a personal loan? </span>
            <Link href="/register" className="text-xs text-[#0F766E] hover:underline font-semibold">
              Create a Borrower Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
