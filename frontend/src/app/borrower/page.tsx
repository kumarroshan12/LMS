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

  // Active Loan & status
  const [activeLoan, setActiveLoan] = useState<LoanRecord | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [fetchingLoan, setFetchingLoan] = useState(true);

  // Form Wizard state: 1: Personal Details, 2: Salary Slip Upload, 3: Loan Config & Apply
  const [wizardStep, setWizardStep] = useState<number>(1);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [pan, setPan] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [monthlySalary, setMonthlySalary] = useState<number | ''>('');
  const [employmentMode, setEmploymentMode] = useState<'Salaried' | 'Self-Employed' | 'Unemployed'>(
    'Salaried'
  );

  // BRE Validation State
  const [breEvaluating, setBreEvaluating] = useState(false);
  const [brePassed, setBrePassed] = useState(false);
  const [breErrors, setBreErrors] = useState<string[]>([]);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Loan Terms Sliders
  const [principalAmount, setPrincipalAmount] = useState<number>(100000); // 50k - 5L
  const [tenureDays, setTenureDays] = useState<number>(180); // 30 - 365 days
  const interestRate = 12; // 12% p.a. fixed

  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Live Simple Interest Math
  // SI = (P * R * T) / (365 * 100)
  const interestAmount = Math.round((principalAmount * interestRate * tenureDays) / (365 * 100) * 100) / 100;
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

  // Step 1: Run Server-side BRE check
  const handleCheckBRE = async (e: React.FormEvent) => {
    e.preventDefault();
    setBreEvaluating(true);
    setBreErrors([]);
    setBrePassed(false);

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
        setBrePassed(true);
        setWizardStep(2); // Advance to Salary Slip Upload
      }
    } catch (err: any) {
      setBrePassed(false);
      if (err.errors && Array.isArray(err.errors)) {
        setBreErrors(err.errors);
      } else {
        setBreErrors([err.message || 'BRE Evaluation Failed. Check your inputs.']);
      }
    } finally {
      setBreEvaluating(false);
    }
  };

  // Step 2: Handle File Upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please choose a salary slip file (PDF, JPG, or PNG, max 5MB).');
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('salarySlip', selectedFile);

    try {
      const res = await apiRequest<{ fileUrl: string; originalName: string }>(
        '/borrower/upload-salary-slip',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (res.success && res.data) {
        setUploadedFileUrl(res.data.fileUrl);
        setUploadedFileName(res.data.originalName);
        setWizardStep(3); // Advance to Loan Config
      }
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed. Ensure size is <= 5MB.');
    } finally {
      setUploading(false);
    }
  };

  // Step 3: Submit Complete Loan Application
  const handleApplyLoan = async () => {
    setSubmittingLoan(true);
    setSubmitError(null);

    try {
      const res = await apiRequest<LoanRecord>('/borrower/apply', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          pan: pan.trim().toUpperCase(),
          dateOfBirth,
          monthlySalary: Number(monthlySalary),
          employmentMode,
          salarySlipUrl: uploadedFileUrl,
          salarySlipOriginalName: uploadedFileName,
          principalAmount,
          tenureDays,
        }),
      });

      if (res.success && res.data) {
        await loadBorrowerLoan();
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit loan application.');
    } finally {
      setSubmittingLoan(false);
    }
  };

  if (authLoading || fetchingLoan) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mr-2" />
        <span>Loading borrower workspace...</span>
      </div>
    );
  }

  // ================= RENDER ACTIVE LOAN STATUS VIEW =================
  if (activeLoan && activeLoan.status !== 'REJECTED') {
    const statusSteps = ['APPLIED', 'SANCTIONED', 'DISBURSED', 'CLOSED'];
    const currentStepIndex = statusSteps.indexOf(activeLoan.status);

    return (
      <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Status Card Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">Application Reference #{activeLoan._id.slice(-6).toUpperCase()}</h1>
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
              Applicant: <span className="font-medium text-slate-700">{activeLoan.fullName}</span> | PAN: <span className="font-medium text-slate-700">{activeLoan.pan}</span>
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

        {/* Lifecycle Tracker */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
            Loan Lifecycle Progression
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
            {statusSteps.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step}
                  className={`p-4 rounded-xl border flex flex-col gap-1 transition ${
                    isCurrent
                      ? 'bg-emerald-50/60 border-emerald-300 shadow-sm'
                      : isCompleted
                      ? 'bg-slate-50 border-slate-200 text-slate-700'
                      : 'bg-white border-slate-100 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Phase 0{idx + 1}
                    </span>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-900">{step}</span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    {step === 'APPLIED' && 'Under review by Sanction desk'}
                    {step === 'SANCTIONED' && 'Approved, queued for fund payout'}
                    {step === 'DISBURSED' && 'Funds released, active repayments'}
                    {step === 'CLOSED' && 'Repayment fully settled'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Loan Financial Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-medium">Principal Loan Amount</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ₹{activeLoan.principalAmount.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Tenure: <span className="font-semibold text-slate-700">{activeLoan.tenureDays} days</span> @ 12% p.a.
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-medium">Total Repayment Due (P + SI)</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ₹{activeLoan.totalRepayment.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Calculated Simple Interest: <span className="font-semibold text-slate-700">₹{activeLoan.interestAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-medium">Outstanding Balance</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              ₹{activeLoan.balanceRemaining.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Total Amount Paid: <span className="font-semibold text-slate-700">₹{activeLoan.totalPaid.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Repayment History Table if Disbursed or Closed */}
        {(activeLoan.status === 'DISBURSED' || activeLoan.status === 'CLOSED') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recorded Repayments</h3>
                <p className="text-xs text-slate-500">Official ledger receipts recorded against your loan account</p>
              </div>
              {activeLoan.status === 'CLOSED' && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                  Zero Outstanding — Account Closed
                </span>
              )}
            </div>

            {payments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No repayments have been recorded yet. The Collection Executive records payments using your UTR confirmation.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">UTR Reference</th>
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
                          ₹{p.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* If loan is closed, show banner to re-apply if desired */}
        {activeLoan.status === 'CLOSED' && (
          <div className="text-center pt-4">
            <button
              onClick={() => setActiveLoan(null)}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              Start New Loan Application
            </button>
          </div>
        )}
      </div>
    );
  }

  // ================= RENDER MULTI-STEP BORROWER ONBOARDING WIZARD =================
  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Wizard Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Borrower Loan Application</h1>
        <p className="text-sm text-slate-500">
          Complete the 3 quick steps below to verify eligibility, upload documents, and customize your loan.
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 pt-4">
          {[
            { step: 1, label: 'Eligibility (BRE)' },
            { step: 2, label: 'Salary Slip' },
            { step: 3, label: 'Loan Configuration' },
          ].map((item, idx) => (
            <React.Fragment key={item.step}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    wizardStep === item.step
                      ? 'bg-emerald-600 text-white shadow-md'
                      : wizardStep > item.step
                      ? 'bg-slate-800 text-emerald-400'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {wizardStep > item.step ? '✓' : item.step}
                </div>
                <span
                  className={`text-xs font-semibold hidden sm:inline ${
                    wizardStep === item.step ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </div>
              {idx < 2 && <div className="w-8 h-0.5 bg-slate-200" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Previous Rejection Alert if applicable */}
      {activeLoan?.status === 'REJECTED' && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <div>
            <span className="font-bold">Previous Application Status: REJECTED</span>
            <p className="mt-0.5">
              Reason provided by Sanction Officer: &quot;{activeLoan.rejectionReason || 'Criteria not met'}&quot;. You may revise your details and submit a fresh application below.
            </p>
          </div>
        </div>
      )}

      {/* STEP 1: PERSONAL DETAILS + BRE VERIFICATION */}
      {wizardStep === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Step 1: Personal Details & Business Rule Engine (BRE)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              The lending rules will be validated directly by our server-side engine. All 4 checks must pass.
            </p>
          </div>

          {/* BRE Error Banner */}
          {breErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Eligibility Check Failed: Application Blocked</span>
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
                placeholder="As per PAN card"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Permanent Account Number (PAN)
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="e.g. ABCDE1234F"
                className="w-full px-3.5 py-2 text-sm uppercase font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-slate-900"
              />
              <span className="text-[10px] text-slate-400">Format: 5 letters, 4 digits, 1 letter</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-slate-900"
              />
              <span className="text-[10px] text-slate-400">Requirement: Age between 23 and 50 years</span>
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
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-slate-900"
              />
              <span className="text-[10px] text-slate-400">Requirement: Minimum ₹25,000 / month</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Mode</label>
              <select
                value={employmentMode}
                onChange={(e) =>
                  setEmploymentMode(e.target.value as 'Salaried' | 'Self-Employed' | 'Unemployed')
                }
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-slate-900"
              >
                <option value="Salaried">Salaried</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Unemployed">Unemployed (Ineligible)</option>
              </select>
              <span className="text-[10px] text-slate-400">Applicants must not be unemployed</span>
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
                    <span>Evaluating Engine Rules...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Eligibility & Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: UPLOAD SALARY SLIP */}
      {wizardStep === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <span>Step 2: Upload Salary Slip</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Provide proof of income. Accepted formats: PDF, JPG, PNG (Maximum 5 MB).
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
              BRE Passed ✓
            </span>
          </div>

          {uploadError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <form onSubmit={handleFileUpload} className="space-y-5">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-emerald-500 transition bg-slate-50/50">
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <div className="text-xs text-slate-600">
                <label className="cursor-pointer font-bold text-emerald-600 hover:text-emerald-500">
                  <span>Click to select file</span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-1">PDF, JPG, or PNG up to 5MB</p>
              </div>

              {selectedFile && (
                <div className="mt-4 p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium inline-flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>{selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-lg bg-slate-50 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading Slip...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Loan Config</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: LOAN CONFIGURATION & APPLY */}
      {wizardStep === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <span>Step 3: Loan Configuration & Apply</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your loan amount and tenure using the sliders. Interest rate is fixed at 12% p.a.
            </p>
          </div>

          {submitError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: Sliders */}
            <div className="space-y-6">
              {/* Principal Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Loan Amount</span>
                  <span className="font-bold text-base text-emerald-700">₹{principalAmount.toLocaleString()}</span>
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
                  <span className="font-semibold text-slate-700">Tenure (Days)</span>
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

              {/* Fixed Interest Indicator */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between text-slate-600">
                <span>Interest Rate:</span>
                <span className="font-bold text-slate-900">12% p.a. (Fixed)</span>
              </div>
            </div>

            {/* Right Column: Live Calculation Breakdown Panel */}
            <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 space-y-4 shadow-lg">
              <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                Repayment Breakdown
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-800">
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Principal (P):</span>
                  <span className="font-semibold text-white">₹{principalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Tenure (T):</span>
                  <span className="font-semibold text-white">{tenureDays} days</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Interest Formula:</span>
                  <span className="font-mono text-[11px] text-slate-400">(P × 12 × T) / 36500</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Simple Interest (SI):</span>
                  <span className="font-semibold text-emerald-400">₹{interestAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-3 text-sm font-bold text-white">
                  <span>Total Repayment (P + SI):</span>
                  <span className="text-base text-emerald-300">₹{totalRepayment.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                * By clicking &quot;Submit Loan Application&quot;, your application status will become APPLIED and enter the Sanction desk queue.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setWizardStep(2)}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-lg bg-slate-50 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleApplyLoan}
              disabled={submittingLoan}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-6 py-2.5 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {submittingLoan ? (
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
        </div>
      )}
    </div>
  );
}
