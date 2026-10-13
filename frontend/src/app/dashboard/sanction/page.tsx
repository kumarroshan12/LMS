'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest, openProtectedFile } from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmModal } from '@/components/ConfirmModal';
import {
  FileCheck2,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
} from 'lucide-react';

interface SanctionLoan {
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
  status: string;
  createdAt: string;
}

export default function LoanSanctionPage() {
  const [loans, setLoans] = useState<SanctionLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Loan for Inspection Drawer/Modal
  const [selectedLoan, setSelectedLoan] = useState<SanctionLoan | null>(null);

  // Approval Modal State
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [loanToApprove, setLoanToApprove] = useState<SanctionLoan | null>(null);

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [loanToReject, setLoanToReject] = useState<SanctionLoan | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  useEffect(() => {
    fetchSanctionQueue();
  }, []);

  const fetchSanctionQueue = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<SanctionLoan[]>('/operations/sanction/queue');
      if (res.success && res.data) {
        setLoans(res.data);
      }
    } catch (err: any) {
      setBannerError(err.message || 'Failed to fetch sanction queue.');
    } finally {
      setLoading(false);
    }
  };

  // Approve Handler
  const handleConfirmApprove = async () => {
    if (!loanToApprove) return;
    setActionLoading(true);
    setBannerSuccess(null);
    setBannerError(null);

    try {
      const res = await apiRequest(`/operations/sanction/${loanToApprove._id}/approve`, {
        method: 'POST',
      });
      if (res.success) {
        setBannerSuccess(`Loan #${loanToApprove._id.slice(-6).toUpperCase()} approved successfully and forwarded to Disbursement.`);
        setApproveModalOpen(false);
        setLoanToApprove(null);
        setSelectedLoan(null);
        await fetchSanctionQueue();
      }
    } catch (err: any) {
      setBannerError(err.message || 'Approval action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Handler
  const handleConfirmReject = async () => {
    if (!loanToReject) return;
    if (!rejectionReason.trim()) {
      setRejectError('A valid rejection reason is strictly required.');
      return;
    }

    setActionLoading(true);
    setRejectError(null);
    setBannerSuccess(null);
    setBannerError(null);

    try {
      const res = await apiRequest(`/operations/sanction/${loanToReject._id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });
      if (res.success) {
        setBannerSuccess(`Loan #${loanToReject._id.slice(-6).toUpperCase()} rejected with official remark logged.`);
        setRejectModalOpen(false);
        setLoanToReject(null);
        setSelectedLoan(null);
        setRejectionReason('');
        await fetchSanctionQueue();
      }
    } catch (err: any) {
      setRejectError(err.message || 'Rejection action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredLoans = loans.filter(
    (l) =>
      l.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.pan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout allowedRoles={['sanction', 'admin']}>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Operations Desk', href: '/dashboard' },
            { label: 'Loan Sanction' },
          ]}
        />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#14243A]">Loan Sanction — Underwriting Desk</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                {loans.length} Pending Review
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review applicant profile, verify salary slip, inspect BRE eligibility, and sanction or reject applications
            </p>
          </div>

          <button
            onClick={fetchSanctionQueue}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* Banners */}
        {bannerSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{bannerSuccess}</span>
            </div>
            <button onClick={() => setBannerSuccess(null)} className="text-emerald-700 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {bannerError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{bannerError}</span>
            </div>
            <button onClick={() => setBannerError(null)} className="text-rose-700 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Applicant Name, PAN, or Loan ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] text-slate-800"
            />
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {filteredLoans.length} files awaiting sanction
          </span>
        </div>

        {/* Queue Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0F766E] mb-2" />
              <span>Loading sanction queue...</span>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2">
              <FileCheck2 className="w-8 h-8 mx-auto text-slate-300" />
              <p>Sanction queue is clear. No applications currently pending underwriting review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Applicant & PAN</th>
                    <th className="px-5 py-3.5">Monthly Income</th>
                    <th className="px-5 py-3.5">Requested Terms</th>
                    <th className="px-5 py-3.5">Total Repayment</th>
                    <th className="px-5 py-3.5">Salary Document</th>
                    <th className="px-5 py-3.5 text-right">Sanction Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLoans.map((loan) => (
                    <tr key={loan._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#14243A]">{loan.fullName}</div>
                        <div className="font-mono text-slate-500 text-[11px]">{loan.pan}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          ₹{loan.monthlySalary.toLocaleString('en-IN')}/mo
                        </div>
                        <div className="text-slate-500 text-[11px]">{loan.employmentMode}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#14243A]">
                          ₹{loan.principalAmount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-slate-500 text-[11px]">{loan.tenureDays} Days @ 12%</div>
                      </td>
                      <td className="px-5 py-4 font-bold text-[#0F766E]">
                        ₹{loan.totalRepayment.toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        {loan.salarySlipUrl ? (
                          <button
                            type="button"
                            onClick={() => void openProtectedFile(`/operations/loans/${loan._id}/salary-slip`)}
                            className="inline-flex items-center gap-1 text-[#0F766E] hover:underline font-semibold"
                          >
                            <span>View Document</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">No document</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setLoanToApprove(loan);
                              setApproveModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] text-white font-semibold text-xs shadow-2xs transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setLoanToReject(loan);
                              setRejectionReason('');
                              setRejectError(null);
                              setRejectModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* APPROVE CONFIRMATION MODAL */}
        <ConfirmModal
          isOpen={approveModalOpen}
          title="Confirm Loan Sanction"
          description={`Are you sure you want to approve this application for ${loanToApprove?.fullName} for ₹${loanToApprove?.principalAmount.toLocaleString('en-IN')}? This will transition status to SANCTIONED and queue it for treasury disbursement.`}
          confirmText="Yes, Sanction Loan"
          confirmVariant="teal"
          isLoading={actionLoading}
          onConfirm={handleConfirmApprove}
          onCancel={() => {
            setApproveModalOpen(false);
            setLoanToApprove(null);
          }}
        />

        {/* REJECT WITH MANDATORY REASON MODAL */}
        <ConfirmModal
          isOpen={rejectModalOpen}
          title="Reject Loan Application"
          description={`Please provide the official reason for rejecting the loan application for ${loanToReject?.fullName}. This remark will be permanently logged and displayed to the borrower.`}
          confirmText="Confirm Rejection"
          confirmVariant="rose"
          isLoading={actionLoading}
          onConfirm={handleConfirmReject}
          onCancel={() => {
            setRejectModalOpen(false);
            setLoanToReject(null);
          }}
        >
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Rejection Remark <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setRejectError(null);
              }}
              placeholder="e.g. Salary documentation discrepancy, credit policy mismatch, or invalid PAN particulars..."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40 text-slate-800"
            />
            {rejectError && <p className="text-[11px] text-rose-600 font-semibold">{rejectError}</p>}
          </div>
        </ConfirmModal>
      </div>
    </AppLayout>
  );
}
