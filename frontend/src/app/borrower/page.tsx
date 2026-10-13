'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { apiRequest } from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { KpiCard } from '@/components/KpiCard';
import { StatusBadge } from '@/components/StatusBadge';
import {
  FileText,
  FilePlus,
  IndianRupee,
  Calendar,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  CreditCard,
} from 'lucide-react';

interface LoanRecord {
  _id: string;
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: string;
  salarySlipUrl: string;
  salarySlipOriginalName: string;
  principalAmount: number;
  tenureDays: number;
  interestRate: number;
  interestAmount: number;
  totalRepayment: number;
  totalPaid: number;
  balanceRemaining: number;
  status: string;
  rejectionReason?: string;
  disbursementReference?: string;
  appliedAt?: string;
  createdAt: string;
}

interface PaymentRecord {
  _id: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
}

export default function BorrowerDashboardPage() {
  const { user } = useAuth();
  const [latestLoan, setLatestLoan] = useState<LoanRecord | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [allLoans, setAllLoans] = useState<LoanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const hasActiveApplication = allLoans.some((loan) =>
    ['APPLIED', 'SANCTIONED', 'DISBURSED'].includes(loan.status)
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [latestRes, loansRes] = await Promise.all([
        apiRequest<{ loan: LoanRecord; payments: PaymentRecord[] }>('/borrower/latest-loan'),
        apiRequest<LoanRecord[]>('/borrower/my-loans'),
      ]);

      if (latestRes.success && latestRes.data && latestRes.data.loan) {
        setLatestLoan(latestRes.data.loan);
        setPayments(latestRes.data.payments || []);
      } else {
        setLatestLoan(null);
      }

      if (loansRes.success && loansRes.data) {
        setAllLoans(loansRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout allowedRoles={['borrower']}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-[#14243A]">
              Welcome back, {user?.fullName || 'Borrower'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor your active loan status, review terms, and track payment receipts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            {!hasActiveApplication && <Link
              href="/borrower/apply"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Apply for New Loan</span>
            </Link>}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Application Status"
            value={latestLoan ? latestLoan.status : 'No Application'}
            icon={FileText}
            subtext={latestLoan ? `Ref: #${latestLoan._id.slice(-6).toUpperCase()}` : 'Ready to apply'}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />

          <KpiCard
            title="Principal Amount"
            value={latestLoan ? `₹${latestLoan.principalAmount.toLocaleString('en-IN')}` : '₹0'}
            icon={IndianRupee}
            subtext={latestLoan ? `${latestLoan.tenureDays} Days @ 12% p.a.` : 'Standard terms'}
            iconColor="text-[#0F766E]"
            iconBg="bg-[#0F766E]/10"
          />

          <KpiCard
            title="Outstanding Balance"
            value={latestLoan ? `₹${latestLoan.balanceRemaining.toFixed(2)}` : '₹0.00'}
            icon={CreditCard}
            subtext={latestLoan ? `Total due: ₹${latestLoan.totalRepayment.toFixed(2)}` : 'No dues'}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />

          <KpiCard
            title="Total Amount Repaid"
            value={latestLoan ? `₹${latestLoan.totalPaid.toFixed(2)}` : '₹0.00'}
            icon={Receipt}
            subtext={`${payments.length} Recorded Payment(s)`}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
        </div>

        {/* Active Application Highlight */}
        {latestLoan ? (
          <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Active Financing Facility
                </span>
                <h2 className="text-base font-bold text-[#14243A] flex items-center gap-2 mt-0.5">
                  <span>Application Reference #{latestLoan._id.slice(-6).toUpperCase()}</span>
                  <StatusBadge status={latestLoan.status} />
                </h2>
              </div>
              <Link
                href={`/borrower/loans/${latestLoan._id}`}
                className="text-xs text-[#0F766E] hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto"
              >
                <span>View Full Details & History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Rejection Alert if applicable */}
            {latestLoan.status === 'REJECTED' && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <span className="font-bold">Application Rejected by Sanction Desk</span>
                  <p className="mt-0.5">
                    Official Reason: &quot;{latestLoan.rejectionReason || 'Underwriting criteria not satisfied'}&quot;. You may adjust your configuration and submit a fresh application.
                  </p>
                </div>
              </div>
            )}

            {/* Terms Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium">Principal Amount</span>
                <div className="text-base font-bold text-[#14243A] mt-1">
                  ₹{latestLoan.principalAmount.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium">Tenure</span>
                <div className="text-base font-bold text-[#14243A] mt-1">
                  {latestLoan.tenureDays} Days
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium">Simple Interest (12%)</span>
                <div className="text-base font-bold text-[#14243A] mt-1">
                  ₹{latestLoan.interestAmount.toFixed(2)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium">Total Repayment Due</span>
                <div className="text-base font-bold text-[#0F766E] mt-1">
                  ₹{latestLoan.totalRepayment.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Repayment Progress Bar */}
            {latestLoan.status !== 'REJECTED' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Repayment Settlement</span>
                  <span className="text-[#0F766E]">
                    {((latestLoan.totalPaid / (latestLoan.totalRepayment || 1)) * 100).toFixed(1)}% Settled
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#0F766E] h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (latestLoan.totalPaid / (latestLoan.totalRepayment || 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto">
              <FilePlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#14243A]">No Active Loan Application</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                You currently do not have any pending or active loans. Check your eligibility and apply in 4 quick steps.
              </p>
            </div>
            {!hasActiveApplication && <Link
              href="/borrower/apply"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <span>Start Loan Application</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
