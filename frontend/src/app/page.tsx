'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth, UserRole } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import {
  Landmark,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Calculator,
  FileCheck,
  Send,
  PiggyBank,
  Users,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const { user, quickLoginAsRole } = useAuth();
  const router = useRouter();

  const handleQuickDemo = async (role: UserRole, targetPath: string) => {
    try {
      await quickLoginAsRole(role);
      router.push(targetPath);
    } catch (err) {
      console.error(err);
      router.push('/login');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Hero Section */}
      <section className="bg-[#0B192C] text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MERN • Next.js • TypeScript • 3-Layer Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Enterprise Loan Management System
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
            A comprehensive lending platform connecting borrowers through an automated BRE-driven onboarding journey and internal executives across Sales, Sanction, Disbursement, and Collection modules.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => handleQuickDemo('borrower', '/borrower')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
            >
              <span>Test Borrower Application</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleQuickDemo('admin', '/dashboard')}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm px-6 py-3 rounded-xl transition"
            >
              <span>Open Operations Workbench</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </section>

      {/* Feature Architecture Cards */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Module Lifecycle Grid */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-8">
            Complete 4-Stage Operational Lifecycle
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Sales */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">1. Sales Module</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Lead tracking of pre-application users who registered but haven&apos;t completed applying.
                </p>
              </div>
              <button
                onClick={() => handleQuickDemo('sales', '/dashboard')}
                className="mt-4 text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Launch Sales View</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Sanction */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <FileCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">2. Sanction Module</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Underwrites applied loans, verifies salary slips, and approves or rejects with reason.
                </p>
              </div>
              <button
                onClick={() => handleQuickDemo('sanction', '/dashboard')}
                className="mt-4 text-xs font-semibold text-amber-600 hover:underline flex items-center gap-1"
              >
                <span>Launch Sanction View</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Disbursement */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">3. Disbursement</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Marks sanctioned loans as disbursed, generates reference code and releases loan funds.
                </p>
              </div>
              <button
                onClick={() => handleQuickDemo('disbursement', '/dashboard')}
                className="mt-4 text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <span>Launch Disbursement View</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Collection */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                  <PiggyBank className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">4. Collection</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Records payments by unique UTR, calculates live remaining balance, and auto-closes loans.
                </p>
              </div>
              <button
                onClick={() => handleQuickDemo('collection', '/dashboard')}
                className="mt-4 text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1"
              >
                <span>Launch Collection View</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Evaluator Credentials Cheat-Sheet */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Evaluator Testing Guide & Seed Credentials</h3>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            All accounts below are pre-configured in the database seed script with password: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-800">Password@123</code>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900">Super Administrator</div>
              <div className="text-slate-500 font-mono mt-0.5">admin@lms.com</div>
              <div className="text-[10px] text-purple-600 font-semibold mt-1">Access to all 4 modules</div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900">Sales Executive</div>
              <div className="text-slate-500 font-mono mt-0.5">sales@lms.com</div>
              <div className="text-[10px] text-blue-600 font-semibold mt-1">Pre-application lead tracker</div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900">Sanction Officer</div>
              <div className="text-slate-500 font-mono mt-0.5">sanction@lms.com</div>
              <div className="text-[10px] text-amber-600 font-semibold mt-1">Approve / Reject applied loans</div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900">Disbursement Officer</div>
              <div className="text-slate-500 font-mono mt-0.5">disbursement@lms.com</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-1">Fund release & reference</div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900">Collection Officer</div>
              <div className="text-slate-500 font-mono mt-0.5">collection@lms.com</div>
              <div className="text-[10px] text-teal-600 font-semibold mt-1">Record unique UTR repayments</div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900">Borrower</div>
              <div className="text-slate-500 font-mono mt-0.5">borrower@lms.com</div>
              <div className="text-[10px] text-slate-600 font-semibold mt-1">Portal application & tracking</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
