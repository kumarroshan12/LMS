'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/authContext';
import { Landmark, Lock, Mail, User, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, register, quickLoginAsRole } = useAuth();
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('borrower');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        const u = await register(fullName, email, password, role, phone);
        if (u.role === 'borrower') {
          router.push('/borrower');
        } else {
          router.push('/dashboard');
        }
      } else {
        const u = await login(email, password);
        if (u.role === 'borrower') {
          router.push('/borrower');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = async (selectedRole: UserRole) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const u = await quickLoginAsRole(selectedRole);
      if (u.role === 'borrower') {
        router.push('/borrower');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login failed. Ensure the database is seeded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0B192C] text-emerald-400 mb-3 shadow-md border border-slate-700">
            <Landmark className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isRegister ? 'Create your Account' : 'Welcome to LMS Portal'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isRegister
              ? 'Register to apply for a loan or manage operations'
              : 'Sign in to access your borrower portal or operations module'}
          </p>
        </div>

        {/* Quick Role Fill for Evaluators */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Evaluator 1-Click Access</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Click any role below to immediately log in with seeded accounts:
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { role: 'borrower' as UserRole, label: 'Borrower', color: 'border-slate-300 hover:border-slate-800' },
              { role: 'sales' as UserRole, label: 'Sales Exec', color: 'border-blue-200 hover:border-blue-600 text-blue-700' },
              { role: 'sanction' as UserRole, label: 'Sanction', color: 'border-amber-200 hover:border-amber-600 text-amber-700' },
              { role: 'disbursement' as UserRole, label: 'Disbursement', color: 'border-emerald-200 hover:border-emerald-600 text-emerald-700' },
              { role: 'collection' as UserRole, label: 'Collection', color: 'border-teal-200 hover:border-teal-600 text-teal-700' },
              { role: 'admin' as UserRole, label: 'Super Admin', color: 'border-purple-200 hover:border-purple-600 text-purple-700' },
            ].map((btn) => (
              <button
                key={btn.role}
                type="button"
                onClick={() => handleQuickSelect(btn.role)}
                disabled={loading}
                className={`py-1.5 px-2 text-xs font-medium bg-slate-50 hover:bg-slate-100 rounded-lg border transition text-center truncate ${btn.color}`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Form Box */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-slate-800 placeholder-slate-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-slate-800 transition"
                  >
                    <option value="borrower">Borrower (Apply for loan)</option>
                    <option value="sales">Sales Executive</option>
                    <option value="sanction">Sanction Executive</option>
                    <option value="disbursement">Disbursement Executive</option>
                    <option value="collection">Collection Executive</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>
              </>
            )}

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
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-slate-800 placeholder-slate-400 transition"
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
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-slate-800 placeholder-slate-400 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
            >
              {loading ? 'Processing...' : isRegister ? 'Complete Sign Up' : 'Sign In'}
            </button>
          </form>

          {/* Toggle Tab */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg(null);
              }}
              className="text-xs text-slate-600 hover:text-emerald-600 font-medium transition"
            >
              {isRegister
                ? 'Already have an account? Sign in here'
                : "Don't have an account yet? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
