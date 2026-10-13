'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { apiRequest } from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  FileText,
  Upload,
  Calculator,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  CreditCard,
  Briefcase,
  IndianRupee,
  ShieldCheck,
  FileCheck2,
  RefreshCw,
  Check,
  Clock,
} from 'lucide-react';

export default function LoanWizardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Wizard Step: 1, 2, 3, 4
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Personal and employment details
  const [fullName, setFullName] = useState('');
  const [pan, setPan] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [monthlySalary, setMonthlySalary] = useState<number | ''>('');
  const [employmentMode, setEmploymentMode] = useState<'Salaried' | 'Self-Employed' | 'Unemployed'>('Salaried');

  // Step 2: Eligibility Check State
  const [breEvaluating, setBreEvaluating] = useState(false);
  const [brePassed, setBrePassed] = useState(false);
  const [breErrors, setBreErrors] = useState<string[]>([]);

  // Step 3: Upload Salary Slip State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Step 4: Loan Configuration
  const [principalAmount, setPrincipalAmount] = useState<number>(100000); // 50k - 5L
  const [tenureDays, setTenureDays] = useState<number>(180); // 30 - 365 days
  const interestRate = 12; // 12% p.a. fixed

  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeApplication, setActiveApplication] = useState<{ _id: string; status: string } | null>(null);

  // Live Simple Interest Math: SI = (P * R * T) / (365 * 100)
  const interestAmount = Math.round(((principalAmount * interestRate * tenureDays) / (365 * 100)) * 100) / 100;
  const totalRepayment = Math.round((principalAmount + interestAmount) * 100) / 100;

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const loadSavedProfile = async () => {
      if (user.fullName) setFullName(user.fullName);
      try {
        const [profileRes, loansRes] = await Promise.all([
          apiRequest<{
          fullName?: string;
          pan?: string;
          dateOfBirth?: string;
          monthlySalary?: number;
          employmentMode?: 'Salaried' | 'Self-Employed' | 'Unemployed';
          eligibility?: { isEligible: boolean; checkedAt?: string };
          }>('/borrower/profile'),
          apiRequest<Array<{ _id: string; status: string }>>('/borrower/my-loans'),
        ]);

        if (cancelled) return;
        const activeLoan = loansRes.data?.find((loan) =>
          ['APPLIED', 'SANCTIONED', 'DISBURSED'].includes(loan.status)
        );
        setActiveApplication(activeLoan || null);

        if (profileRes.success && profileRes.data) {
          const profile = profileRes.data;
          if (profile.fullName) setFullName(profile.fullName);
          if (profile.pan) setPan(profile.pan);
          if (profile.dateOfBirth) setDateOfBirth(profile.dateOfBirth.slice(0, 10));
          if (profile.monthlySalary !== undefined) setMonthlySalary(profile.monthlySalary);
          if (profile.employmentMode) setEmploymentMode(profile.employmentMode);
          if (profile.eligibility?.isEligible) {
            setBrePassed(true);
            setCurrentStep(3);
          }
        }
      } catch (error) {
        console.error('Failed to load saved borrower profile.', error);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    loadSavedProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Step 1 -> Step 2: Validate fields then trigger BRE
  const handleProceedToBRE = (e: React.FormEvent) => {
    e.preventDefault();
    if (brePassed) {
      setCurrentStep(3);
      return;
    }
    setCurrentStep(2);
    runEligibilityCheck();
  };

  // Step 2: Eligibility Check (BRE)
  const runEligibilityCheck = async () => {
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
      }
    } catch (err: any) {
      setBrePassed(false);
      if (err.errors && Array.isArray(err.errors)) {
        setBreErrors(err.errors);
      } else {
        setBreErrors([err.message || 'BRE evaluation failed. Application is ineligible.']);
      }
    } finally {
      setBreEvaluating(false);
    }
  };

  // Step 3: Handle Salary Slip Upload
  const handleUploadSalarySlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !uploadedFileUrl) {
      setFileError('Please select a valid salary slip (PDF, JPG, or PNG, max 5MB).');
      return;
    }

    if (uploadedFileUrl) {
      setCurrentStep(4);
      return;
    }

    setUploadingFile(true);
    setFileError(null);

    const formData = new FormData();
    formData.append('salarySlip', selectedFile!);

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
        setCurrentStep(4);
      }
    } catch (err: any) {
      setFileError(err.message || 'File upload failed. Ensure file is within 5MB limit.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Step 4: Final Submit Application
  const handleSubmitApplication = async () => {
    setSubmittingLoan(true);
    setSubmitError(null);

    try {
      const res = await apiRequest('/borrower/apply', {
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

      if (res.success) {
        setSubmitSuccess(true);
        setCurrentStep(1);
        setPan('');
        setDateOfBirth('');
        setMonthlySalary('');
        setEmploymentMode('Salaried');
        setBrePassed(false);
        setBreErrors([]);
        setSelectedFile(null);
        setUploadedFileUrl('');
        setUploadedFileName('');
        setPrincipalAmount(100000);
        setTenureDays(180);
        setSubmitError(null);
        window.setTimeout(() => {
          router.replace('/borrower');
        }, 1800);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit loan application.');
    } finally {
      setSubmittingLoan(false);
    }
  };

  return (
    <AppLayout allowedRoles={['borrower']}>
      <div className="max-w-3xl mx-auto space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Borrower', href: '/borrower' },
            { label: 'Loan Application Wizard' },
          ]}
        />

        {/* Wizard Title */}
        <div className="text-center space-y-1 pb-2">
          <h1 className="text-2xl font-bold text-[#14243A]">Loan Application Wizard</h1>
          <p className="text-xs text-slate-500">
            Follow the 4-step guided underwriting process to apply for personal financing
          </p>
        </div>

        {profileLoading ? (
          <div className="bg-white p-10 rounded-xl border border-slate-200/90 shadow-sm text-center text-sm text-slate-500">Loading your saved customer profile...</div>
        ) : activeApplication ? (
          <div className="bg-white p-10 rounded-xl border border-amber-200 shadow-sm text-center space-y-3">
            <Clock className="w-10 h-10 text-amber-600 mx-auto" />
            <h2 className="text-lg font-bold text-[#14243A]">An application is already in process</h2>
            <p className="text-sm text-slate-600">You can’t start another loan application while application #{activeApplication._id.slice(-6).toUpperCase()} is {activeApplication.status.toLowerCase()}.</p>
            <button type="button" onClick={() => router.replace('/borrower')} className="px-5 py-2.5 bg-[#0F766E] text-white text-xs font-semibold rounded-lg">View application status</button>
          </div>
        ) : submitSuccess ? (
          <div className="bg-white p-10 rounded-xl border border-slate-200/90 shadow-sm text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
            <h2 className="text-lg font-bold text-emerald-900">Submitted successfully</h2>
            <p className="text-xs text-slate-500">
              Your loan application has been received. Redirecting to your dashboard...
            </p>
          </div>
        ) : (
          <>
        {/* Step Indicator Header */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="grid grid-cols-4 gap-2">
            {[
              { step: 1, title: 'Details', desc: 'Personal info' },
              { step: 2, title: 'Eligibility', desc: 'BRE check' },
              { step: 3, title: 'Documents', desc: 'Salary slip' },
              { step: 4, title: 'Review', desc: 'Terms & apply' },
            ].map((s) => {
              const isCurrent = currentStep === s.step;
              const isCompleted = currentStep > s.step;

              return (
                <div key={s.step} className="flex flex-col items-center text-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      isCurrent
                        ? 'bg-[#0F766E] text-white shadow-sm ring-2 ring-[#0F766E]/20'
                        : isCompleted
                        ? 'bg-[#14243A] text-teal-400'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.step}
                  </div>
                  <span
                    className={`text-[11px] font-bold mt-1.5 ${
                      isCurrent ? 'text-[#14243A]' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {s.title}
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">{s.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= STEP 1: PERSONAL & EMPLOYMENT DETAILS ================= */}
        {currentStep === 1 && (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-[#14243A] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0F766E]" />
                <span>Step 1: Personal & Employment Details</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {brePassed
                  ? 'Your verified customer details are saved and locked for this application.'
                  : 'Enter your identity, PAN credentials, and income mode for eligibility evaluation.'}
              </p>
            </div>

            <form onSubmit={handleProceedToBRE} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  disabled={brePassed}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name as printed on PAN card"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Card Number</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={pan}
                  disabled={brePassed}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  className="w-full px-3.5 py-2 text-xs uppercase font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 text-slate-800"
                />
                <span className="text-[10px] text-slate-400">10-character alphanumeric PAN format</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  disabled={brePassed}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 text-slate-800"
                />
                <span className="text-[10px] text-slate-400">Required age: 23 to 50 years</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Salary (₹)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={monthlySalary}
                  disabled={brePassed}
                  onChange={(e) => setMonthlySalary(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 60000"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 text-slate-800"
                />
                <span className="text-[10px] text-slate-400">Minimum threshold: ₹25,000 / month</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Status</label>
                <select
                  value={employmentMode}
                  disabled={brePassed}
                  onChange={(e) =>
                    setEmploymentMode(e.target.value as 'Salaried' | 'Self-Employed' | 'Unemployed')
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 text-slate-800"
                >
                  <option value="Salaried">Salaried Employee</option>
                  <option value="Self-Employed">Self-Employed Professional</option>
                  <option value="Unemployed">Unemployed</option>
                </select>
                <span className="text-[10px] text-slate-400">Must be actively employed</span>
              </div>

              <div className="sm:col-span-2 pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  <span>{brePassed ? 'Continue to Documents' : 'Proceed to Eligibility Check'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 2: LOAN ELIGIBILITY CHECK (BRE) ================= */}
        {currentStep === 2 && (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-[#14243A] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0F766E]" />
                <span>Step 2: Business Rule Engine (BRE) Verification</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                The underwriting engine tests your parameters against statutory credit policy rules.
              </p>
            </div>

            {breEvaluating ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#0F766E] animate-spin mx-auto" />
                <h3 className="text-sm font-bold text-[#14243A]">Checking your eligibility</h3>
                <p className="text-xs text-slate-500">Please wait while we verify your application.</p>
              </div>
            ) : brePassed ? (
              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>You are eligible</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    You meet the requirements for this loan. Continue to upload your documents.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-2.5 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
                  >
                    <span>Proceed to Document Upload</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <span>Application Blocked — Eligibility Requirements Not Met</span>
                  </div>
                  <p className="text-xs text-rose-700">
                    The backend rule engine has rejected your submission for the following reason(s):
                  </p>
                  <ul className="text-xs text-rose-700 space-y-1 list-disc pl-5 font-medium">
                    {breErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Modify Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={runEligibilityCheck}
                    className="px-4 py-2 text-xs font-semibold bg-[#14243A] hover:bg-slate-800 text-white rounded-lg transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-evaluate Rules</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 3: SALARY SLIP UPLOAD ================= */}
        {currentStep === 3 && (
          <form onSubmit={handleUploadSalarySlip} className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-[#14243A] flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#0F766E]" />
                <span>Step 3: Upload Salary Slip (Income Proof)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload your most recent salary slip. Accepted formats: PDF, JPG, PNG (maximum 5 MB).
              </p>
            </div>

            {fileError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-[#0F766E] transition bg-slate-50/50">
              <FileCheck2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <div className="text-xs text-slate-600">
                <label className="cursor-pointer font-bold text-[#0F766E] hover:underline">
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
                <p className="text-[11px] text-slate-400 mt-1">PDF, JPG, or PNG up to 5MB</p>
              </div>

              {(selectedFile || uploadedFileName) && (
                <div className="mt-4 p-2.5 bg-teal-50 text-[#0F766E] rounded-lg text-xs font-semibold inline-flex items-center gap-2 border border-teal-200">
                  <FileText className="w-4 h-4 text-[#0F766E]" />
                  <span>
                    {selectedFile ? selectedFile.name : uploadedFileName}
                    {selectedFile && ` (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)`}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={(!selectedFile && !uploadedFileUrl) || uploadingFile}
                className="px-5 py-2.5 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {uploadingFile ? (
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
        )}

        {/* ================= STEP 4: LOAN CONFIGURATION & FINAL REVIEW ================= */}
        {currentStep === 4 && (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-[#14243A] flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#0F766E]" />
                <span>Step 4: Loan Configuration & Final Review</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Customize loan parameters, review terms calculation, and submit application.
              </p>
            </div>

            {submitError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Sliders */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Loan Amount</span>
                    <span className="font-bold text-base text-[#0F766E]">
                      ₹{principalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50000}
                    max={500000}
                    step={10000}
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                    className="w-full accent-[#0F766E] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>₹50,000</span>
                    <span>₹5,00,000</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Tenure</span>
                    <span className="font-bold text-base text-[#14243A]">{tenureDays} Days</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={365}
                    step={5}
                    value={tenureDays}
                    onChange={(e) => setTenureDays(Number(e.target.value))}
                    className="w-full accent-[#0F766E] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>30 Days</span>
                    <span>365 Days</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <span className="text-slate-600">Fixed Interest Rate:</span>
                  <span className="font-bold text-[#14243A]">12% p.a.</span>
                </div>
              </div>

              {/* Repayment Breakdown Card */}
              <div className="bg-[#14243A] text-white p-6 rounded-xl border border-slate-800 space-y-4 shadow-md">
                <div className="text-[11px] uppercase tracking-widest text-[#14B8A6] font-bold">
                  Repayment Breakdown
                </div>

                <div className="space-y-2.5 text-xs divide-y divide-slate-800">
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>Principal (P):</span>
                    <span className="font-semibold text-white">₹{principalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>Tenure (T):</span>
                    <span className="font-semibold text-white">{tenureDays} days</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>Calculated Simple Interest:</span>
                    <span className="font-semibold text-[#14B8A6]">₹{interestAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-3 text-sm font-bold text-white">
                    <span>Total Repayment Due:</span>
                    <span className="text-base text-teal-300">₹{totalRepayment.toFixed(2)}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-tight">
                  * On clicking &quot;Submit Application&quot;, your file is logged as APPLIED and enters the underwriting queue.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={submittingLoan}
                className="px-6 py-2.5 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {submittingLoan ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Application</span>
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
