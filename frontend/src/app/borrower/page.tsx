'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { apiRequest } from '@/lib/api';
import {
  FileText,
  Upload,
  Calculator,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  CreditCard,
  Briefcase,
  IndianRupee,
  Clock,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
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
  status: 'DRAFT' | 'APPLIED' | 'SANCTIONED' | 'DISBURSED' | 'REJECTED' | 'CLOSED';
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
  createdAt: string;
}

export default function BorrowerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Active Loan & tracking
  const [activeLoan, setActiveLoan] = useState<LoanRecord | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [fetchingLoan, setFetchingLoan] = useState(true);

  // 2-Step Application Flow:
  // Step 1: Borrower Details & Eligibility Check (BRE)
  // Step 2: Loan Application (Salary Slip Upload + Sliders + Submit)
  const [applicationStep, setApplicationStep] = useState<1 | 2>(1);

  // Form Fields - Step 1: Details
  const [fullName, setFullName] = useState('');
  const [pan, setPan] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [monthlySalary, setMonthlySalary] = useState<number | ''>('');
  const [employmentMode, setEmploymentMode] = useState<'Salaried' | 'Self-Employed' | 'Unemployed'>('Salaried');

  // BRE Evaluation State
  const [breEvaluating, setBreEvaluating] = useState(false);
  const [breErrors, setBreErrors] = useState<string[]>([]);

  // Step 2: File Upload & Loan Config
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Loan Sliders
  const [principalAmount, setPrincipalAmount] = useState<number>(100000); // 50k - 5L
  const [tenureDays, setTenureDays] = useState<number>(180); // 30 - 365 days
  const interestRate = 12; // 12% p.a. fixed

  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Live Simple Interest Calculation: SI = (P * R * T) / (365 * 100)
  const interestAmount = Math.round(((principalAmount * interestRate * tenureDays) / (365 * 100)) * 100) / 100;
  const totalRepayment = Math.round((principalAmount + interestAmount) * 100) / 100;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'borrower' && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    if (user) {
      setFullName(user.fullName || '');
      loadBorrowerLoan();
    }
  }, [user, authLoading]);

  const loadBorrowerLoan = async () => {
    try {
      setFetchingLoan(true);
      const res = await apiRequest<{ loan: LoanRecord; payments: PaymentRecord[] }>('/borrower/latest-loan');
      if (res.success && res.data && res.data.loan) {
        setActiveLoan(res.data.loan);
        setPayments(res.data.payments || []);
      } else {
        setActiveLoan(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingLoan(false);
    }
  };

  // Step 1: Run Business Rule Engine (BRE) check
  const handleCheckBRE = async (e: React.FormEvent) => {
    e.preventDefault();
    setBreEvaluating(true);
    setBreErrors([]);

    try {
      const res = await apiRequest('/borrower/eligibility', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          pan: pan.trim().toUpperCase(),
          dateOfBirth,
          monthlySalary: Number(monthlySalary),
          employmentMode,
        }),
      });

      if (res.success) {
        setApplicationStep(2); // Advance directly to Loan Application & Upload
      }
    } catch (err: any) {
      if (err.errors && Array.isArray(err.errors)) {
        setBreErrors(err.errors);
      } else {
        setBreErrors([err.message || 'Eligibility check failed. Please review your details.']);
      }
    } finally {
      setBreEvaluating(false);
    }
  };

  // Step 2: Handle salary slip upload and application submission
  const handleSubmitFullApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFileError(null);

    if (!selectedFile && !uploadedFileUrl) {
      setFileError('Please select and upload your salary slip (PDF, JPG, or PNG, max 5MB).');
      return;
    }

    setSubmittingLoan(true);

    try {
      let finalSlipUrl = uploadedFileUrl;
      let finalSlipName = uploadedFileName;

      // 1. Upload file if not already uploaded
      if (selectedFile && !uploadedFileUrl) {
        setUploadingFile(true);
        const formData = new FormData();
        formData.append('salarySlip', selectedFile);

        const uploadRes = await apiRequest<{ fileUrl: string; originalName: string }>(
          '/borrower/upload-salary-slip',
          {
            method: 'POST',
            body: formData,
          }
        );

        if (uploadRes.success && uploadRes.data) {
          finalSlipUrl = uploadRes.data.fileUrl;
          finalSlipName = uploadRes.data.originalName;
          setUploadedFileUrl(finalSlipUrl);
          setUploadedFileName(finalSlipName);
        } else {
          throw new Error('Failed to upload salary slip.');
        }
        setUploadingFile(false);
      }

      // 2. Submit complete application with terms
      const applyRes = await apiRequest<LoanRecord>('/borrower/apply', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          pan: pan.trim().toUpperCase(),
          dateOfBirth,
          monthlySalary: Number(monthlySalary),
          employmentMode,
          salarySlipUrl: finalSlipUrl,
          salarySlipOriginalName: finalSlipName,
          principalAmount,
          tenureDays,
        }),
      });

      if (applyRes.success && applyRes.data) {
        await loadBorrowerLoan();
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit loan application.');
    } finally {
      setUploadingFile(false);
      setSubmittingLoan(false);
    }
  };

  if (authLoading || fetchingLoan) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-600 mr-2" />
        <span className="text-xs">Loading borrower portal...</span>
      </div>
    );
  }

  // ================= 1. ACTIVE LOAN STATUS VIEW =================
  if (activeLoan && activeLoan.status !== 'REJECTED') {
    const statusSteps = ['APPLIED', 'SANCTIONED', 'DISBURSED', 'CLOSED'];
    const currentStepIndex = statusSteps.indexOf(activeLoan.status);

    return (
      <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Status Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">
                Loan Application #{activeLoan._id.slice(-6).toUpperCase()}
              </h1>
              <span
                className={`text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider ${
                  activeLoan.status === 'APPLIED'
                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                    : activeLoan.status === 'SANCTIONED'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : activeLoan.status === 'DISBURSED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : activeLoan.status === 'CLOSED'
                    ? 'bg-slate-100 text-slate-800 border border-slate-300'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {activeLoan.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Borrower: <span className="font-semibold text-slate-700">{activeLoan.fullName}</span> | PAN: <span className="font-mono text-slate-700 font-semibold">{activeLoan.pan}</span>
            </p>
          </div>

          <button
            onClick={loadBorrowerLoan}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Status</span>
          </button>
        </div>

        {/* Lifecycle Progression Timeline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
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
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
                      : isCompleted
                      ? 'bg-slate-50 border-slate-200 text-slate-700'
                      : 'bg-white border-slate-100 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Step 0{idx + 1}
                    </span>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-900">{step}</span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    {step === 'APPLIED' && 'Under review by Sanction team'}
                    {step === 'SANCTIONED' && 'Approved, awaiting fund release'}
                    {step === 'DISBURSED' && 'Funds released, repayments active'}
                    {step === 'CLOSED' && 'Repayment fully settled'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-medium">Principal Sanctioned</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ₹{activeLoan.principalAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Tenure: <span className="font-semibold text-slate-700">{activeLoan.tenureDays} days</span> @ 12% p.a.
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-medium">Total Repayment Due (P + SI)</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ₹{activeLoan.totalRepayment.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Simple Interest: <span className="font-semibold text-slate-700">₹{activeLoan.interestAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-medium">Outstanding Balance</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              ₹{activeLoan.balanceRemaining.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Total Repaid: <span className="font-semibold text-slate-700">₹{activeLoan.totalPaid.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Recorded Repayments Table */}
        {(activeLoan.status === 'DISBURSED' || activeLoan.status === 'CLOSED') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recorded Repayments</h3>
                <p className="text-xs text-slate-500">Official payments recorded against unique bank UTR numbers</p>
              </div>
              {activeLoan.status === 'CLOSED' && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                  Loan Fully Settled & Closed
                </span>
              )}
            </div>

            {payments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No repayments recorded yet. The Collection team records incoming payments with the transaction UTR number.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Unique UTR Reference</th>
                      <th className="px-6 py-3 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-3.5 text-slate-700 font-medium">
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-900 font-semibold">{p.utrNumber}</td>
                        <td className="px-6 py-3.5 text-right font-bold text-emerald-700">
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

        {/* If loan is closed, allow new application */}
        {activeLoan.status === 'CLOSED' && (
          <div className="text-center pt-4">
            <button
              onClick={() => setActiveLoan(null)}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl transition shadow-sm"
            >
              Apply for a New Loan
            </button>
          </div>
        )}
      </div>
    );
  }

  // ================= 2. SHORT APPLICATION FLOW =================
  return (
    <div className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Loan Application Portal</h1>
        <p className="text-xs text-slate-500">
          Complete the application below to verify your eligibility and configure your loan terms.
        </p>

        {/* Application Progress Bar */}
        <div className="flex items-center justify-center gap-3 pt-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                applicationStep === 1
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-emerald-400'
              }`}
            >
              {applicationStep > 1 ? '✓' : '1'}
            </div>
            <span
              className={`text-xs font-semibold ${
                applicationStep === 1 ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              1. Borrower Details & Eligibility (BRE)
            </span>
          </div>

          <div className="w-8 h-0.5 bg-slate-200" />

          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                applicationStep === 2
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              2
            </div>
            <span
              className={`text-xs font-semibold ${
                applicationStep === 2 ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              2. Loan Application & Documents
            </span>
          </div>
        </div>
      </div>

      {/* Previous Rejection Alert if applicable */}
      {activeLoan?.status === 'REJECTED' && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <span className="font-bold">Previous Application Status: REJECTED</span>
            <p className="mt-0.5">
              Reason from Sanction Officer: &quot;{activeLoan.rejectionReason || 'Underwriting criteria not met'}&quot;. You may revise your details and submit a new application below.
            </p>
          </div>
        </div>
      )}

      {/* ================= STEP 1: BORROWER DETAILS + BRE CHECK ================= */}
      {applicationStep === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Step 1: Borrower Details & Eligibility Assessment</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Our automated Business Rule Engine (BRE) verifies your age, monthly income, PAN format, and employment mode.
            </p>
          </div>

          {/* BRE Error Banner (Reject if any rule fails) */}
          {breErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Eligibility Criteria Not Met: Application Ineligible</span>
              </div>
              <ul className="list-disc pl-5 text-xs text-rose-700 space-y-1">
                {breErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleCheckBRE} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name as printed on PAN card"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PAN Card Number
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="e.g. ABCDE1234F"
                className="w-full px-3.5 py-2 text-xs uppercase font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-slate-900"
              />
              <span className="text-[10px] text-slate-400">10-character alphanumeric PAN format</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-slate-900"
              />
              <span className="text-[10px] text-slate-400">Eligibility requirement: 23 to 50 years old</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Salary (₹)</label>
              <input
                type="number"
                required
                min={0}
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 50000"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-slate-900"
              />
              <span className="text-[10px] text-slate-400">Requirement: Minimum ₹25,000 / month</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Status</label>
              <select
                value={employmentMode}
                onChange={(e) =>
                  setEmploymentMode(e.target.value as 'Salaried' | 'Self-Employed' | 'Unemployed')
                }
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-slate-900"
              >
                <option value="Salaried">Salaried</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Unemployed">Unemployed</option>
              </select>
              <span className="text-[10px] text-slate-400">Applicants must be actively employed</span>
            </div>

            <div className="sm:col-span-2 pt-4 flex justify-end">
              <button
                type="submit"
                disabled={breEvaluating}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {breEvaluating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking Eligibility (BRE)...</span>
                  </>
                ) : (
                  <>
                    <span>Check Eligibility & Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= STEP 2: LOAN APPLICATION (SLIP + SLIDERS) ================= */}
      {applicationStep === 2 && (
        <form onSubmit={handleSubmitFullApplication} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <span>Step 2: Loan Terms & Salary Slip Upload</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure your loan amount and tenure, upload your proof of income, and submit your application.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
              BRE Passed ✓
            </span>
          </div>

          {submitError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {fileError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Salary Slip File Upload Box */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Salary Slip Document (Proof of Income)</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-emerald-500 transition bg-slate-50/50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs text-slate-600">
                <label className="cursor-pointer font-bold text-emerald-600 hover:text-emerald-500">
                  <span>Browse and select file</span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        setUploadedFileUrl('');
                        setFileError(null);
                      }
                    }}
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">PDF, JPG, or PNG (maximum 5 MB)</p>
              </div>

              {selectedFile && (
                <div className="mt-3 p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium inline-flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>{selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              )}
            </div>
          </div>

          {/* Loan Sliders & Live Calculation Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left Column: Sliders */}
            <div className="space-y-5">
              {/* Principal Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Loan Amount</span>
                  <span className="font-bold text-base text-emerald-700">₹{principalAmount.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={500000}
                  step={10000}
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>₹50,000</span>
                  <span>₹5,00,000</span>
                </div>
              </div>

              {/* Tenure Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Tenure</span>
                  <span className="font-bold text-base text-slate-900">{tenureDays} Days</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={365}
                  step={5}
                  value={tenureDays}
                  onChange={(e) => setTenureDays(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>30 Days</span>
                  <span>365 Days</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between text-slate-600">
                <span>Interest Rate:</span>
                <span className="font-bold text-slate-900">12% p.a. (Fixed)</span>
              </div>
            </div>

            {/* Right Column: Live Repayment Panel */}
            <div className="bg-[#0B192C] text-white p-5 rounded-xl border border-slate-800 space-y-3 shadow-md">
              <div className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold">
                Repayment Calculation
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-800">
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Principal (P):</span>
                  <span className="font-semibold text-white">₹{principalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Tenure (T):</span>
                  <span className="font-semibold text-white">{tenureDays} days</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Simple Interest:</span>
                  <span className="font-semibold text-emerald-400">₹{interestAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2.5 text-sm font-bold text-white">
                  <span>Total Repayment Due:</span>
                  <span className="text-base text-emerald-300">₹{totalRepayment.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                * On submission, your loan is created with status APPLIED for the Sanction team to review.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setApplicationStep(1)}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-lg bg-slate-50 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Details</span>
            </button>

            <button
              type="submit"
              disabled={submittingLoan || uploadingFile}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-6 py-2.5 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {submittingLoan || uploadingFile ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <span>Submit Loan Application</span>
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
