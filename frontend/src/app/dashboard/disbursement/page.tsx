'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Send, Search, RefreshCw, CheckCircle, AlertCircle, FileText, IndianRupee } from 'lucide-react';

interface DisbLoan {
  _id: string;
  fullName: string;
  pan: string;
  principalAmount: number;
  tenureDays: number;
  totalRepayment: number;
  status: string;
  sanctionedAt?: string;
  createdAt: string;
}

export default function LoanDisbursementPage() {
  const [loans, setLoans] = useState<DisbLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Disburse Modal State
  const [disburseModalOpen, setDisburseModalOpen] = useState(false);
  const [loanToDisburse, setLoanToDisburse] = useState<DisbLoan | null>(null);
  const [referenceId, setReferenceId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  useEffect(() => {
    fetchDisbursementQueue();
  }, []);

  const fetchDisbursementQueue = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<DisbLoan[]>('/operations/disbursement/queue');
      if (res.success && res.data) {
        setLoans(res.data);
      }
    } catch (err: any) {
      setBannerError(err.message || 'Failed to fetch disbursement queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDisburseModal = (loan: DisbLoan) => {
    setLoanToDisburse(loan);
    setReferenceId(`DISB-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`);
    setDisburseModalOpen(true);
  };

  const handleConfirmDisbursement = async () => {
    if (!loanToDisburse) return;

    setActionLoading(true);
    setBannerSuccess(null);
    setBannerError(null);

    try {
      const res = await apiRequest(`/operations/disbursement/${loanToDisburse._id}/disburse`, {
        method: 'POST',
        body: JSON.stringify({ disbursementReference: referenceId.trim() }),
      });

      if (res.success) {
        setBannerSuccess(`Funds successfully marked as DISBURSED for loan #${loanToDisburse._id.slice(-6).toUpperCase()} with reference ${referenceId}. Active loan moved to Collections.`);
        setDisburseModalOpen(false);
        setLoanToDisburse(null);
        await fetchDisbursementQueue();
      }
    } catch (err: any) {
      setBannerError(err.message || 'Disbursement action failed.');
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
    <AppLayout allowedRoles={['disbursement', 'admin']}>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Operations Desk', href: '/dashboard' },
            { label: 'Loan Disbursement' },
          ]}
        />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#14243A]">Loan Disbursement — Treasury Desk</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-[#0F766E] border border-teal-200">
                {loans.length} Sanctioned & Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Execute payout workflows for approved/sanctioned loans to transition accounts into active repayment
            </p>
          </div>

          <button
            onClick={fetchDisbursementQueue}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* Notifications */}
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
              placeholder="Search by Applicant, PAN, or Reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] text-slate-800"
            />
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {filteredLoans.length} sanctioned facilities
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0F766E] mb-2" />
              <span>Loading disbursement queue...</span>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2">
              <Send className="w-8 h-8 mx-auto text-slate-300" />
              <p>No sanctioned loans currently awaiting treasury disbursement.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Borrower & PAN</th>
                    <th className="px-5 py-3.5">Approved Loan Amount</th>
                    <th className="px-5 py-3.5">Tenure & Terms</th>
                    <th className="px-5 py-3.5">Sanction Status</th>
                    <th className="px-5 py-3.5 text-right">Treasury Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLoans.map((loan) => (
                    <tr key={loan._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#14243A]">{loan.fullName}</div>
                        <div className="font-mono text-slate-500 text-[11px]">{loan.pan}</div>
                      </td>
                      <td className="px-5 py-4 font-bold text-[#0F766E] text-sm">
                        ₹{loan.principalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <div>{loan.tenureDays} Days @ 12% p.a.</div>
                        <div className="text-slate-400 text-[11px]">Total: ₹{loan.totalRepayment.toFixed(2)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={loan.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleOpenDisburseModal(loan)}
                          className="px-4 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] text-white font-semibold text-xs shadow-2xs transition"
                        >
                          Disburse Funds
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* DISBURSE CONFIRMATION MODAL */}
        <ConfirmModal
          isOpen={disburseModalOpen}
          title="Confirm Treasury Fund Release"
          description={`Release ₹${loanToDisburse?.principalAmount.toLocaleString('en-IN')} to borrower ${loanToDisburse?.fullName}. This will transition the loan status to DISBURSED and activate repayment tracking in the Collection module.`}
          confirmText="Confirm Disbursement"
          confirmVariant="teal"
          isLoading={actionLoading}
          onConfirm={handleConfirmDisbursement}
          onCancel={() => {
            setDisburseModalOpen(false);
            setLoanToDisburse(null);
          }}
        >
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Disbursement Transaction Reference ID
            </label>
            <input
              type="text"
              required
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value.toUpperCase())}
              placeholder="e.g. DISB-20261013-1049"
              className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 text-slate-800"
            />
            <span className="text-[10px] text-slate-400">
              Official transaction reference logged in the borrower ledger
            </span>
          </div>
        </ConfirmModal>
      </div>
    </AppLayout>
  );
}
