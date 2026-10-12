'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function AccessDeniedPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col justify-center items-center p-6 text-center">
      <div className="bg-white max-w-md w-full p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">
            HTTP 403 — Unauthorized Access
          </span>
          <h1 className="text-xl font-bold text-[#14243A]">Access Denied</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your account ({user ? `${user.fullName} [${user.role}]` : 'Guest'}) does not have permission to access this internal module. Role-Based Access Control (RBAC) enforces separation across departmental desks.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          {user?.role === 'borrower' ? (
            <Link
              href="/borrower"
              className="px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back to Borrower Portal</span>
            </Link>
          ) : user ? (
            <Link
              href="/dashboard"
              className="px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back to Operations Workbench</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2"
            >
              <span>Sign In with Authorized Account</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
