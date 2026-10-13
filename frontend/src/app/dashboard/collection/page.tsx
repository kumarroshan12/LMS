'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StatusBadge } from '@/components/StatusBadge';
import {
  PiggyBank,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Receipt,
  Eye,
  CreditCard,
  X,
} from 'lucide-react';

interface CollectLoan {
  _id: string;
  fullName: string;
  pan: string;
  disbursementReference?: string;
  principalAmount: number;
  tenureDays: number;
  totalRepayment: number;
  totalPaid: number;
  balanceRemaining: number;
  status: string;
  createdAt: string;
}

interface PaymentRecord {
  _id: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  collectedBy?: {
    fullName: string;
    email: string;
  };
}

export default function LoanCollectionPage() {
  const [loans, setLoans] = useState<CollectLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Record Payment Modal State
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<CollectLoan | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // History Drawer/Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyLoan, setHistoryLoan] = useState<CollectLoan | null>(null);
  const [historyPayments, setHistoryPayments] = useState<PaymentRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  useEffect(() => {
    fetchCollectionQueue();
  }, []);

  const fetchCollectionQueue = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<CollectLoan[]>('/operations/collection/queue');
      if (res.success && res.data) {
        setLoans(res.data);
      }
    } catch (err: any) {
      setBannerError(err.message || 'Failed to fetch collection portfolio.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecordModal = (loan: CollectLoan) => {
    setSelectedLoan(loan);
    setPaymentAmount(Math.round(loan.balanceRemaining * 100) / 100);
    setUtrNumber(`UTR${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentError(null);
    setRecordModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !paymentAmount || !utrNumber.trim()) return;

    setActionLoading(true);
    setPaymentError(null);
    setBannerSuccess(null);
    setBannerError(null);

    try {
      const res = await apiRequest(`/operations/collection/${selectedLoan._id}/repay`, {
        method: 'POST',
        body: JSON.stringify({
          utrNumber: utrNumber.trim().toUpperCase(),
          amount: Number(paymentAmount),
          paymentDate,
        }),
      });

      if (res.success) {
        setBannerSuccess(
          res.data?.isClosed
            ? `Full balance received! Loan #${selectedLoan._id.slice(-6).toUpperCase()} is now fully CLOSED.`
            : `Payment receipt recorded for loan #${selectedLoan._id.slice(-6).toUpperCase()}.`
        );
        setRecordModalOpen(false);
        setSelectedLoan(null);
        await fetchCollectionQueue();
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to record repayment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenHistoryModal = async (loan: CollectLoan) => {
    setHistoryLoan(loan);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await apiRequest<PaymentRecord[]>(`/operations/collection/${loan._id}/payments`);
      if (res.success && res.data) {
        setHistoryPayments(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredLoans = loans.filter(
    (l) =>
      l.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.pan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.disbursementReference && l.disbursementReference.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppLayout allowedRoles={['collection', 'admin']}>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Operations Desk', href: '/dashboard' },
            { label: 'Loan Collection' },
          ]}
        />

        {/* Page Header */}
          <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-lg font-bold text-[#14243A] sm:text-xl">Loan Collection — Repayments & Ledger</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {loans.length} Accounts in Portfolio
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Record borrower repayments using unique bank UTR numbers, validate balances, and track auto-closure
            </p>
          </div>

          <button
            onClick={fetchCollectionQueue}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Banners */}
        {bannerSuccess && (
          <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="min-w-0 break-words">{bannerSuccess}</span>
            </div>
            <button onClick={() => setBannerSuccess(null)} className="text-emerald-700 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {bannerError && (
          <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="min-w-0 break-words">{bannerError}</span>
            </div>
            <button onClick={() => setBannerError(null)} className="text-rose-700 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4">
          <div className="relative w-full flex-1 sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Borrower, PAN, or Reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] text-slate-800"
            />
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {filteredLoans.length} active collection accounts
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0F766E] mb-2" />
              <span>Loading collection ledger...</span>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2">
              <PiggyBank className="w-8 h-8 mx-auto text-slate-300" />
              <p>No active loans in the collection ledger.</p>
            </div>
          ) : (
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Loan ID & Borrower</th>
                    <th className="px-5 py-3.5">Total Repayment</th>
                    <th className="px-5 py-3.5">Total Repaid</th>
                    <th className="px-5 py-3.5">Outstanding Balance</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Ledger Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLoans.map((loan) => (
                    <tr key={loan._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#14243A]">{loan.fullName}</div>
                        <div className="font-mono text-slate-400 text-[10px]">
                          Ref: {loan.disbursementReference || `#${loan._id.slice(-6).toUpperCase()}`}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        ₹{loan.totalRepayment.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-700">
                        ₹{loan.totalPaid.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 font-bold text-[#14243A]">
                        ₹{loan.balanceRemaining.toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={loan.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenHistoryModal(loan)}
                            className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold border border-slate-200 flex items-center gap-1 transition"
                            title="View Payment Receipts"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Receipts</span>
                          </button>

                          {loan.status === 'CLOSED' ? (
                            <span className="text-slate-400 text-xs font-semibold italic px-2">
                              Fully Closed
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenRecordModal(loan)}
                              className="px-3 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold shadow-2xs transition"
                            >
                              Record Payment
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RECORD PAYMENT MODAL */}
        {recordModalOpen && selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#14243A]/60 p-2 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="my-auto max-h-[calc(100dvh-1rem)] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-[#14243A] flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#0F766E]" />
                  <span>Record Repayment Receipt</span>
                </h3>
                <button
                  onClick={() => setRecordModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Outstanding balance alert box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div>
                  Borrower: <span className="font-bold text-[#14243A]">{selectedLoan.fullName}</span>
                </div>
                <div>
                  Outstanding Balance:{' '}
                  <span className="font-bold text-emerald-700 text-sm">
                    ₹{selectedLoan.balanceRemaining.toFixed(2)}
                  </span>
                </div>
              </div>

              {paymentError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              <form onSubmit={handleRecordPayment} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unique Transaction Reference (UTR Number) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. CMS982347101298"
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">
                    System prevents duplicate UTR entries across all loans
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Payment Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentAmount(Math.round(selectedLoan.balanceRemaining * 100) / 100)
                      }
                      className="text-[10px] text-[#0F766E] hover:underline font-semibold"
                    >
                      Fill Full Balance (₹{selectedLoan.balanceRemaining.toFixed(2)})
                    </button>
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    max={Math.round((selectedLoan.balanceRemaining + 0.05) * 100) / 100}
                    value={paymentAmount}
                    onChange={(e) =>
                      setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">
                    Supports decimal values (up to ₹{selectedLoan.balanceRemaining.toFixed(2)})
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Receipt Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRecordModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-semibold bg-[#0F766E] hover:bg-[#0D655E] text-white rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm & Record</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PAYMENT HISTORY MODAL */}
        {historyModalOpen && historyLoan && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#14243A]/60 p-2 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="my-auto max-h-[calc(100dvh-1rem)] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#14243A]">Payment Receipts Ledger</h3>
                  <p className="text-xs text-slate-500">
                    Loan #{historyLoan._id.slice(-6).toUpperCase()} • {historyLoan.fullName}
                  </p>
                </div>
                <button
                  onClick={() => setHistoryModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {historyLoading ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0F766E] mb-2" />
                  <span>Loading ledger...</span>
                </div>
              ) : historyPayments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No payment receipts recorded for this account yet.
                </div>
              ) : (
                <div className="max-h-60 overflow-x-auto overflow-y-auto overscroll-x-contain">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-3 py-2.5">Date</th>
                        <th className="px-3 py-2.5">Unique UTR</th>
                        <th className="px-3 py-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyPayments.map((p) => (
                        <tr key={p._id}>
                          <td className="px-3 py-2.5 text-slate-600">
                            {new Date(p.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2.5 font-mono font-bold text-[#14243A]">
                            {p.utrNumber}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-emerald-700">
                            ₹{p.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setHistoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
