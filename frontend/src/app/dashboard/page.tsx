'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/authContext';
import { apiRequest } from '@/lib/api';
import {
  Users,
  FileCheck,
  Send,
  PiggyBank,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  ExternalLink,
  AlertCircle,
  Clock,
  IndianRupee,
  Shield,
  Layers,
  Check,
  Calendar,
  CreditCard,
} from 'lucide-react';

interface LeadUser {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  createdAt: string;
}

interface LoanItem {
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

interface AdminSummary {
  leadsCount: number;
  appliedCount: number;
  sanctionedCount: number;
  disbursedCount: number;
  totalCollected: number;
  statusBreakdown: Array<{ _id: string; count: number; totalAmount: number }>;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Active module tab
  const [activeTab, setActiveTab] = useState<'sales' | 'sanction' | 'disbursement' | 'collection' | 'overview'>('overview');

  // Data states
  const [loadingData, setLoadingData] = useState(true);
  const [leads, setLeads] = useState<LeadUser[]>([]);
  const [sanctionQueue, setSanctionQueue] = useState<LoanItem[]>([]);
  const [disbursementQueue, setDisbursementQueue] = useState<LoanItem[]>([]);
  const [collectionQueue, setCollectionQueue] = useState<LoanItem[]>([]);
  const [adminSummary, setAdminSummary] = useState<AdminSummary | null>(null);

  // Action Modals State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectLoanId, setRejectLoanId] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [processingAction, setProcessingAction] = useState(false);

  // Payment Recording Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoan, setPaymentLoan] = useState<LoanItem | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role === 'borrower') {
      router.push('/borrower');
      return;
    }
    if (user) {
      // Set initial tab based on role
      if (user.role === 'admin') {
        setActiveTab('overview');
      } else {
        setActiveTab(user.role as any);
      }
      loadModuleData(user.role);
    }
  }, [user, authLoading]);

  const loadModuleData = async (roleOverride?: UserRole) => {
    const currentRole = roleOverride || user?.role;
    if (!currentRole) return;

    setLoadingData(true);
    setActionError(null);

    try {
      if (currentRole === 'admin') {
        const [sumRes, leadsRes, sancRes, disbRes, collRes] = await Promise.all([
          apiRequest<AdminSummary>('/operations/admin/summary'),
          apiRequest<LeadUser[]>('/operations/sales/leads'),
          apiRequest<LoanItem[]>('/operations/sanction/queue'),
          apiRequest<LoanItem[]>('/operations/disbursement/queue'),
          apiRequest<LoanItem[]>('/operations/collection/queue'),
        ]);
        if (sumRes.success && sumRes.data) setAdminSummary(sumRes.data);
        if (leadsRes.success && leadsRes.data) setLeads(leadsRes.data);
        if (sancRes.success && sancRes.data) setSanctionQueue(sancRes.data);
        if (disbRes.success && disbRes.data) setDisbursementQueue(disbRes.data);
        if (collRes.success && collRes.data) setCollectionQueue(collRes.data);
      } else if (currentRole === 'sales') {
        const res = await apiRequest<LeadUser[]>('/operations/sales/leads');
        if (res.success && res.data) setLeads(res.data);
      } else if (currentRole === 'sanction') {
        const res = await apiRequest<LoanItem[]>('/operations/sanction/queue');
        if (res.success && res.data) setSanctionQueue(res.data);
      } else if (currentRole === 'disbursement') {
        const res = await apiRequest<LoanItem[]>('/operations/disbursement/queue');
        if (res.success && res.data) setDisbursementQueue(res.data);
      } else if (currentRole === 'collection') {
        const res = await apiRequest<LoanItem[]>('/operations/collection/queue');
        if (res.success && res.data) setCollectionQueue(res.data);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to fetch operations data.');
    } finally {
      setLoadingData(false);
    }
  };

  // ================= ACTION HANDLERS =================
  const handleApproveLoan = async (loanId: string) => {
    setActionError(null);
    setActionSuccess(null);
    setProcessingAction(true);
    try {
      const res = await apiRequest(`/operations/sanction/${loanId}/approve`, {
        method: 'POST',
      });
      if (res.success) {
        setActionSuccess('Loan successfully approved and forwarded to Disbursement.');
        await loadModuleData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve loan.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleOpenRejectModal = (loanId: string) => {
    setRejectLoanId(loanId);
    setRejectReason('');
    setRejectModalOpen(true);
    setActionError(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setActionError('Please specify a rejection reason.');
      return;
    }
    setProcessingAction(true);
    setActionError(null);
    try {
      const res = await apiRequest(`/operations/sanction/${rejectLoanId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.success) {
        setRejectModalOpen(false);
        setActionSuccess('Loan application marked as REJECTED.');
        await loadModuleData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject loan.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDisburseLoan = async (loanId: string) => {
    setActionError(null);
    setActionSuccess(null);
    setProcessingAction(true);
    try {
      const res = await apiRequest(`/operations/disbursement/${loanId}/disburse`, {
        method: 'POST',
      });
      if (res.success) {
        setActionSuccess('Funds marked as DISBURSED. Loan moved to Collection module.');
        await loadModuleData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to disburse funds.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleOpenPaymentModal = (loan: LoanItem) => {
    setPaymentLoan(loan);
    setPaymentAmount(loan.balanceRemaining);
    setUtrNumber(`UTR${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentModalOpen(true);
    setActionError(null);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentLoan || !paymentAmount || !utrNumber) return;

    setProcessingAction(true);
    setActionError(null);
    try {
      const res = await apiRequest(`/operations/collection/${paymentLoan._id}/repay`, {
        method: 'POST',
        body: JSON.stringify({
          utrNumber: utrNumber.trim().toUpperCase(),
          amount: Number(paymentAmount),
          paymentDate,
        }),
      });

      if (res.success) {
        setPaymentModalOpen(false);
        setActionSuccess(res.message || 'Payment recorded successfully.');
        await loadModuleData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to record repayment.');
    } finally {
      setProcessingAction(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mr-2" />
        <span>Authenticating executive access...</span>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0B192C] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Operations Lifecycle Workbench</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">
            {isAdmin ? 'Central Administration Portal' : `${user.role.toUpperCase()} Management Module`}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authenticated as <span className="text-slate-200 font-semibold">{user.fullName}</span> ({user.email})
          </p>
        </div>

        <button
          onClick={() => loadModuleData()}
          disabled={loadingData}
          className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg border border-slate-700 transition self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Module Navigation Tabs (Admin gets full switcher; Executives only see their authorized module) */}
      {isAdmin && (
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          {[
            { id: 'overview', label: 'Admin Overview', icon: Layers },
            { id: 'sales', label: `1. Sales Leads (${leads.length})`, icon: Users },
            { id: 'sanction', label: `2. Sanction Queue (${sanctionQueue.length})`, icon: FileCheck },
            { id: 'disbursement', label: `3. Disbursement (${disbursementQueue.length})`, icon: Send },
            { id: 'collection', label: `4. Collection (${collectionQueue.length})`, icon: PiggyBank },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[#0B192C] text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ================= ADMIN OVERVIEW VIEW ================= */}
      {isAdmin && activeTab === 'overview' && adminSummary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unapplied Leads</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{adminSummary.leadsCount}</div>
              <span className="text-[11px] text-blue-600 font-medium">Sales Pipeline</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Sanction</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">{adminSummary.appliedCount}</div>
              <span className="text-[11px] text-amber-600 font-medium">Underwriting Desk</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ready to Disburse</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{adminSummary.sanctionedCount}</div>
              <span className="text-[11px] text-emerald-600 font-medium">Treasury Desk</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Repaid Sum</span>
              <div className="text-2xl font-bold text-teal-700 mt-1">₹{adminSummary.totalCollected.toLocaleString()}</div>
              <span className="text-[11px] text-teal-600 font-medium">Collection Ledger</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= 1. SALES MODULE ================= */}
      {(activeTab === 'sales' || user.role === 'sales') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Sales Module — Pre-Application Lead Tracking</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Displays registered borrowers who have not yet submitted a formal loan application.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full self-start sm:self-auto">
              Total Leads: {leads.length}
            </span>
          </div>

          {leads.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No pending leads. All registered borrowers have either applied or completed onboarding.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Lead Name</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Registered On</th>
                    <th className="px-4 py-3 text-right">Lead Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{lead.fullName}</td>
                      <td className="px-4 py-3.5 text-slate-600">{lead.email}</td>
                      <td className="px-4 py-3.5 text-slate-600">{lead.phone || 'N/A'}</td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                          Pre-Application Lead
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= 2. SANCTION MODULE ================= */}
      {(activeTab === 'sanction' || user.role === 'sanction') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-600" />
                <span>Sanction Module — Applied Loans Underwriting Queue</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review applicant profile, verify salary slip, and approve (Sanction) or reject with reason.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full self-start sm:self-auto">
              Pending Review: {sanctionQueue.length}
            </span>
          </div>

          {sanctionQueue.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              Sanction queue is clear. No loans currently awaiting review.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Applicant & PAN</th>
                    <th className="px-4 py-3">Income & Mode</th>
                    <th className="px-4 py-3">Requested Terms</th>
                    <th className="px-4 py-3">Salary Document</th>
                    <th className="px-4 py-3 text-right">Underwriting Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sanctionQueue.map((loan) => (
                    <tr key={loan._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{loan.fullName}</div>
                        <div className="font-mono text-slate-500 text-[11px]">{loan.pan}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">₹{loan.monthlySalary.toLocaleString()}/mo</div>
                        <div className="text-slate-500 text-[11px]">{loan.employmentMode}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">₹{loan.principalAmount.toLocaleString()}</div>
                        <div className="text-slate-500 text-[11px]">
                          {loan.tenureDays}d @ 12% = ₹{loan.totalRepayment.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {loan.salarySlipUrl ? (
                          <a
                            href={`http://localhost:5000${loan.salarySlipUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium underline"
                          >
                            <span>View Slip</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">No document</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveLoan(loan._id)}
                            disabled={processingAction}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-sm disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenRejectModal(loan._id)}
                            disabled={processingAction}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold transition disabled:opacity-50"
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
      )}

      {/* ================= 3. DISBURSEMENT MODULE ================= */}
      {(activeTab === 'disbursement' || user.role === 'disbursement') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>Disbursement Module — Approved Loans Treasury Release</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Execute treasury payouts for approved/sanctioned loans to transition them to active status.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full self-start sm:self-auto">
              Ready for Payout: {disbursementQueue.length}
            </span>
          </div>

          {disbursementQueue.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No loans awaiting disbursement.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Applicant</th>
                    <th className="px-4 py-3">Disbursement Amount</th>
                    <th className="px-4 py-3">Sanction Details</th>
                    <th className="px-4 py-3 text-right">Treasury Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {disbursementQueue.map((loan) => (
                    <tr key={loan._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{loan.fullName}</div>
                        <div className="text-slate-500 text-[11px]">PAN: {loan.pan}</div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-700 text-sm">
                        ₹{loan.principalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div>Tenure: {loan.tenureDays} days</div>
                        <div className="text-[11px] text-slate-400">Total Due: ₹{loan.totalRepayment.toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleDisburseLoan(loan._id)}
                          disabled={processingAction}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-sm disabled:opacity-50"
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
      )}

      {/* ================= 4. COLLECTION MODULE ================= */}
      {(activeTab === 'collection' || user.role === 'collection') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-teal-600" />
                <span>Collection Module — Active Repayments & Auto-Closure</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Record borrower repayments by unique UTR. Auto-closes loan account when total repaid reaches total due.
              </p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full self-start sm:self-auto">
              Active Portfolio: {collectionQueue.length}
            </span>
          </div>

          {collectionQueue.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No active disbursed loans in collection.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Borrower & Ref</th>
                    <th className="px-4 py-3">Total Due</th>
                    <th className="px-4 py-3">Total Repaid</th>
                    <th className="px-4 py-3">Outstanding Balance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Repayment Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {collectionQueue.map((loan) => (
                    <tr key={loan._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{loan.fullName}</div>
                        <div className="font-mono text-slate-400 text-[10px]">
                          {loan.disbursementReference || loan._id.slice(-6).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        ₹{loan.totalRepayment.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-700">
                        ₹{loan.totalPaid.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        ₹{loan.balanceRemaining.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            loan.status === 'CLOSED'
                              ? 'bg-slate-100 text-slate-700 border border-slate-300'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {loan.status === 'CLOSED' ? (
                          <span className="text-[11px] text-slate-400 font-semibold italic">Fully Settled</span>
                        ) : (
                          <button
                            onClick={() => handleOpenPaymentModal(loan)}
                            disabled={processingAction}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold transition shadow-sm disabled:opacity-50"
                          >
                            Record Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= REJECT REASON MODAL ================= */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Provide Rejection Reason</h3>
            <p className="text-xs text-slate-500">
              Please enter the official reason for rejecting this loan application. This will be visible to the borrower.
            </p>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Salary documentation discrepancy, credit policy mismatch..."
              className="w-full p-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={processingAction}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm disabled:opacity-50"
              >
                {processingAction ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RECORD PAYMENT MODAL ================= */}
      {paymentModalOpen && paymentLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-teal-600" />
              <span>Record Repayment Receipt</span>
            </h3>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div>Borrower: <span className="font-bold text-slate-900">{paymentLoan.fullName}</span></div>
              <div>Outstanding Balance: <span className="font-bold text-emerald-700">₹{paymentLoan.balanceRemaining.toLocaleString()}</span></div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unique Transaction Reference (UTR Number)
                </label>
                <input
                  type="text"
                  required
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. UTR123456789012"
                  className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                />
                <span className="text-[10px] text-slate-400">Must be globally unique across all system payments</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={paymentLoan.balanceRemaining}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                />
                <span className="text-[10px] text-slate-400">
                  Cannot exceed outstanding balance of ₹{paymentLoan.balanceRemaining.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-sm disabled:opacity-50"
                >
                  {processingAction ? 'Recording...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
