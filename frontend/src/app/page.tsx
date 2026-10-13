'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import {
  Landmark,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Calculator,
  FileCheck2,
  Send,
  PiggyBank,
  Users,
  Lock,
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Enterprise Fintech Hero Section */}
      <section className="bg-[#0B192C] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-semibold shadow-inner">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Automated Lending & Underwriting Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            A Smarter Way to Manage Your Loan Journey
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
            Check your eligibility, apply online, and track your loan from application to repayment.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {user ? (
              user.role === 'borrower' ? (
                <Link
                  href="/borrower"
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
                >
                  <span>Go to My Loan Application</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
                >
                  <span>Go to Operations Workbench</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )
            ) : (
              <>
                <Link
                  href="/register"
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
                >
                  <span>Apply for a Loan</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/login?portal=customer"
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl transition"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Customer Sign In</span>
                </Link>

                <Link
                  href="/login?portal=employee"
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl transition"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Employee Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Structured Lending Process Section */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-16 lg:py-20 space-y-14">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            A SIMPLE, STEP-BY-STEP PROCESS
          </h2>
          <h3 className="text-2xl font-bold text-slate-900">How the Loan Process Works</h3>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            From eligibility verification to full repayment, our system guarantees full transparency at each step.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-7">
          {/* Step 1 */}
          <div className="bg-white p-7 lg:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 relative">
            <span className="text-3xl font-extrabold text-slate-100 absolute top-4 right-4">01</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900 pr-8">1. Details & BRE Check</h4>
            <p className="text-sm text-slate-600 mt-3 leading-6">
              Enter your personal and employment details to check whether you meet the basic eligibility criteria, including age, income, PAN format, and employment status.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-7 lg:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 relative">
            <span className="text-3xl font-extrabold text-slate-100 absolute top-4 right-4">02</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <Calculator className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900 pr-8">2. Configure & Apply</h4>
            <p className="text-sm text-slate-600 mt-3 leading-6">
              Upload your salary slip, choose your loan amount and tenure, review the estimated interest and total repayment, then submit your application online.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-7 lg:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 relative">
            <span className="text-3xl font-extrabold text-slate-100 absolute top-4 right-4">03</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900 pr-8">3. Sanction & Payout</h4>
            <p className="text-sm text-slate-600 mt-3 leading-6">
              Your application is reviewed by the designated team. Track the decision and, if approved, follow the disbursement process as your loan moves toward payout.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-7 lg:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 relative">
            <span className="text-3xl font-extrabold text-slate-100 absolute top-4 right-4">04</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <PiggyBank className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900 pr-8">4. Repayment & Closure</h4>
            <p className="text-sm text-slate-600 mt-3 leading-6">
              Track your repayments, review your outstanding balance and payment history, and follow your loan through to full repayment and closure.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
