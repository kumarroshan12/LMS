'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Landmark, Lock, Mail, AlertCircle, RefreshCw, Users, Building2 } from 'lucide-react';

function LoginForm() {
  const { login, clearSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const portal = searchParams.get('portal') === 'employee' ? 'employee' : 'customer';
  const isEmployeePortal = portal === 'employee';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const copy = useMemo(
    () =>
      isEmployeePortal
        ? {
            title: 'Employee Sign In',
            subtitle: 'Access the operations workbench for sales, sanction, disbursement, and collections',
          }
        : {
            title: 'Customer Sign In',
            subtitle: 'Sign in to check eligibility, apply for a loan, and track repayments',
          },
    [isEmployeePortal]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const u = await login(email, password);
      const isBorrower = u.role === 'borrower';

      if (isEmployeePortal && isBorrower) {
        clearSession();
        setErrorMsg('This portal is for employees only. Please use Customer Sign In.');
        return;
      }

      if (!isEmployeePortal && !isBorrower) {
        clearSession();
        setErrorMsg('This portal is for customers only. Please use Employee Sign In.');
        return;
      }

      const roleRoutes: Record<string, string> = {
        borrower: '/borrower',
        admin: '/dashboard',
        sales: '/dashboard/sales',
        sanction: '/dashboard/sanction',
        disbursement: '/dashboard/disbursement',
        collection: '/dashboard/collection',
      };
      router.replace(roleRoutes[u.role] ?? '/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shadow-md">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#14243A]">
              Lend<span className="text-[#0F766E]">Flow</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-[#14243A]">{copy.title}</h2>
          <p className="mt-1 text-xs text-slate-500">{copy.subtitle}</p>
        </div>

        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <Link
            href="/login?portal=customer"
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
              !isEmployeePortal
                ? 'bg-[#0F766E] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Customer
          </Link>
          <Link
            href="/login?portal=employee"
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
              isEmployeePortal
                ? 'bg-[#14243A] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Employee
          </Link>
        </div>

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
                  placeholder={isEmployeePortal ? 'employee@company.com' : 'name@domain.com'}
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
              className={`w-full py-2.5 px-4 rounded-lg text-white font-semibold text-xs transition shadow-sm hover:shadow focus:outline-none disabled:opacity-50 flex items-center justify-center gap-2 ${
                isEmployeePortal
                  ? 'bg-[#14243A] hover:bg-slate-800 focus:ring-2 focus:ring-slate-400/50'
                  : 'bg-[#0F766E] hover:bg-[#0D655E] focus:ring-2 focus:ring-[#0F766E]/50'
              }`}
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEmployeePortal ? 'Sign In as Employee' : 'Sign In as Customer'}</span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            {isEmployeePortal ? (
              <p className="text-xs text-slate-500">Employee accounts are provisioned by the administrator.</p>
            ) : (
              <>
                <span className="text-xs text-slate-500">Need a personal loan? </span>
                <Link href="/register" className="text-xs text-[#0F766E] hover:underline font-semibold">
                  Create a Borrower Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin text-[#0F766E] mr-2" />
          <span className="text-xs font-medium">Loading sign in...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
