'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StatusBadge } from '@/components/StatusBadge';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  IndianRupee,
  Calendar,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  Receipt,
  FileCheck2,
} from 'lucide-react';

interface LoanDetails {
  _id: string;
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: string;
  salarySlipUrl?: string;
  salarySlipOriginalName?: string;
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
  sanctionedAt?: string;
  disbursedAt?: string;
  closedAt?: string;
  createdAt: string;
}

interface PaymentRecord {
  _id: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  createdAt: string;
}

function LoanDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loan, setLoan] = useState<LoanDetails | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchLoanDetails();
    }
  }, [id]);

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await apiRequest<{ loan: LoanDetails; payments: PaymentRecord[] }>(
        `/borrower/loans/${id}`
      );
      if (res.success && res.data) {
        setLoan(res.data.loan);
        setPayments(res.data.payments || []);
      } else {
        setErrorMsg('Loan details not found.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load loan file.');
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = ['APPLIED', 'SANCTIONED', 'DISBURSED', 'CLOSED'];
  const currentStepIndex = loan ? statusSteps.indexOf(loan.status) : -1;

  return (
    <AppLayout allowedRoles={['borrower']}>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Borrower', href: '/borrower' },
            { label: 'My Loans', href: '/borrower/loans' },
            { label: loan ? `#${loan._id.slice(-6).toUpperCase()}` : 'Loan Details' },
          ]}
        />

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0F766E] mb-2" />
            <span>Fetching loan details...</span>
          </div>
        ) : errorMsg || !loan ? (
          <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
            <h2 className="text-base font-bold text-[#14243A]">Unable to Load Application</h2>
            <p className="text-xs text-slate-500">{errorMsg || 'Loan application record not found.'}</p>
            <button
              onClick={() => router.push('/borrower/loans')}
              className="px-4 py-2 bg-[#14243A] text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
            >
              Back to My Loans
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  LendFlow Credit Facility
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <h1 className="text-xl font-bold text-[#14243A]">
                    Loan #{loan._id.slice(-6).toUpperCase()}
                  </h1>
                  <StatusBadge status={loan.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Submitted on {new Date(loan.createdAt).toLocaleDateString()}
                  {loan.disbursementReference && ` • Ref: ${loan.disbursementReference}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchLoanDetails}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Rejection Alert if REJECTED */}
            {loan.status === 'REJECTED' && (
              <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-sm text-rose-900">Application Status: REJECTED</span>
                  <p className="leading-relaxed">
                    Underwriting Reason: &quot;{loan.rejectionReason || 'Criteria not met.'}&quot;
                  </p>
                  <p className="text-rose-600 font-medium">
                    This file has been closed by the Sanction desk. You may initiate a new application from your dashboard.
                  </p>
                </div>
              </div>
            )}

            {/* Lifecycle Progression Tracker */}
            {loan.status !== 'REJECTED' && (
              <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm space-y-4">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Lifecycle Stage Progression
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {statusSteps.map((step, idx) => {
                    const isCompleted = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <div
                        key={step}
                        className={`p-4 rounded-xl border flex flex-col gap-1 transition ${
                          isCurrent
                            ? 'bg-teal-50/60 border-teal-300 shadow-xs'
                            : isCompleted
                            ? 'bg-slate-50 border-slate-200 text-slate-700'
                            : 'bg-white border-slate-100 text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            0{idx + 1}
                          </span>
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-[#0F766E]" />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <span className="text-sm font-bold text-[#14243A]">{step}</span>
                        <span className="text-[11px] text-slate-500 leading-tight">
                          {step === 'APPLIED' && 'Underwriting desk review'}
                          {step === 'SANCTIONED' && 'Sanctioned & awaiting payout'}
                          {step === 'DISBURSED' && 'Funds released, active ledger'}
                          {step === 'CLOSED' && 'Full repayment confirmed'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Financial Terms Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
                <span className="text-xs text-slate-400 font-medium">Principal Sanctioned</span>
                <div className="text-2xl font-bold text-[#14243A]">
                  ₹{loan.principalAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-slate-500 pt-1">
                  Tenure: <span className="font-semibold text-slate-700">{loan.tenureDays} days</span> @ 12% p.a.
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
                <span className="text-xs text-slate-400 font-medium">Total Repayment Due (P + SI)</span>
                <div className="text-2xl font-bold text-[#14243A]">
                  ₹{loan.totalRepayment.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 pt-1">
                  Simple Interest: <span className="font-semibold text-slate-700">₹{loan.interestAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
                <span className="text-xs text-slate-400 font-medium">Outstanding Balance</span>
                <div className="text-2xl font-bold text-[#0F766E]">
                  ₹{loan.balanceRemaining.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 pt-1">
                  Total Repaid: <span className="font-semibold text-slate-700">₹{loan.totalPaid.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Applicant & Documentation Details */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Borrower Identification & Income Proof
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Full Name</span>
                  <div className="font-bold text-[#14243A] mt-0.5">{loan.fullName}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">PAN Number</span>
                  <div className="font-mono font-bold text-[#14243A] mt-0.5">{loan.pan}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Monthly Salary</span>
                  <div className="font-bold text-[#14243A] mt-0.5">₹{loan.monthlySalary.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Employment Status</span>
                  <div className="font-bold text-[#14243A] mt-0.5">{loan.employmentMode}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#0F766E]" />
                  <span className="text-slate-600 font-medium">Uploaded Salary Slip:</span>
                  <span className="text-slate-800 font-semibold">{loan.salarySlipOriginalName || 'salary_slip.pdf'}</span>
                </div>
                {loan.salarySlipUrl && (
                  <a
                    href={`http://localhost:5000${loan.salarySlipUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0F766E] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Download / View Document</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Repayment History Table */}
            {(loan.status === 'DISBURSED' || loan.status === 'CLOSED') && (
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden space-y-3 p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#14243A] flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#0F766E]" />
                      <span>Repayment History & Receipts</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      All verified bank receipts logged against unique bank UTR numbers
                    </p>
                  </div>
                  {loan.status === 'CLOSED' && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      Loan Fully Closed
                    </span>
                  )}
                </div>

                {payments.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No repayments recorded yet. Incoming collections will be shown here.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3">Receipt Date</th>
                          <th className="px-4 py-3">Unique UTR Reference</th>
                          <th className="px-4 py-3 text-right">Amount Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payments.map((p) => (
                          <tr key={p._id} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-3.5 text-slate-700 font-medium">
                              {new Date(p.paymentDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-[#14243A] font-bold">
                              {p.utrNumber}
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold text-[#0F766E]">
                              ₹{p.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function LoanDetailsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin text-[#0F766E] mr-2" />
          <span className="text-xs font-medium">Loading loan details...</span>
        </div>
      }
    >
      <LoanDetailsContent />
    </React.Suspense>
  );
}
