'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { apiRequest } from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { KpiCard } from '@/components/KpiCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  Users,
  FileCheck2,
  Send,
  PiggyBank,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

interface AdminSummary {
  leadsCount: number;
  appliedCount: number;
  sanctionedCount: number;
  disbursedCount: number;
  totalCollected: number;
  statusBreakdown: Array<{ _id: string; count: number; totalAmount: number }>;
}

interface RecentTask {
  _id: string;
  fullName: string;
  pan: string;
  principalAmount: number;
  tenureDays: number;
  status: string;
  createdAt: string;
}

// Role → their dedicated module route
const ROLE_HOME: Record<string, string> = {
  sales: '/dashboard/sales',
  sanction: '/dashboard/sanction',
  disbursement: '/dashboard/disbursement',
  collection: '/dashboard/collection',
};

export default function OperationsDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Non-admin employees should never land here — send them home
  useEffect(() => {
    if (user && user.role !== 'admin') {
      const dest = ROLE_HOME[user.role];
      if (dest) {
        router.replace(dest);
      }
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadDashboardMetrics();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadDashboardMetrics = async () => {
    try {
      setLoading(true);
      const [sumRes, appliedRes] = await Promise.all([
        apiRequest<AdminSummary>('/operations/admin/summary').catch(() => ({
          success: false,
          data: null,
        })),
        apiRequest<RecentTask[]>('/operations/sanction/queue').catch(() => ({
          success: false,
          data: [],
        })),
      ]);

      if (sumRes.success && sumRes.data) setSummary(sumRes.data);
      if (appliedRes.success && appliedRes.data)
        setRecentTasks(appliedRes.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // While redirecting non-admin roles, show a spinner
  if (!user || (user.role !== 'admin' && ROLE_HOME[user.role])) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-[#0F766E] mr-2" />
        <span className="text-xs font-medium">Redirecting to your workspace…</span>
      </div>
    );
  }

  return (
    <AppLayout allowedRoles={['admin'] as any}>
      <div className="space-y-6">
        <Breadcrumbs
          items={[{ label: 'Operations Desk', href: '/dashboard' }, { label: 'Admin Overview' }]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#14243A]">Operations Overview</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enterprise-wide pipeline, treasury, and collection metrics
            </p>
          </div>
          <button
            onClick={loadDashboardMetrics}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* KPI Grid — Admin only */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Pre-App Leads"
            value={summary ? summary.leadsCount : '—'}
            icon={Users}
            subtext="Sales pipeline"
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <KpiCard
            title="Pending Sanction"
            value={summary ? summary.appliedCount : '—'}
            icon={FileCheck2}
            subtext="Awaiting underwriting"
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
          <KpiCard
            title="Ready for Payout"
            value={summary ? summary.sanctionedCount : '—'}
            icon={Send}
            subtext="Treasury queue"
            iconColor="text-[#0F766E]"
            iconBg="bg-[#0F766E]/10"
          />
          <KpiCard
            title="Total Repaid"
            value={summary ? `₹${summary.totalCollected.toFixed(2)}` : '₹0.00'}
            icon={PiggyBank}
            subtext="Collection ledger"
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
        </div>

        {/* Module Cards — Admin only */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Departmental Workspaces
          </span>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Sales */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#14243A]">Sales Management</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Registered borrowers without a formal loan application.
                </p>
              </div>
              <Link
                href="/dashboard/sales"
                className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Open Sales Leads</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Sanction */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#14243A]">Loan Sanction</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Review applications, verify salary slip, approve or reject.
                </p>
              </div>
              <Link
                href="/dashboard/sanction"
                className="mt-4 text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <span>Open Sanction Queue</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Disbursement */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center mb-3">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#14243A]">Loan Disbursement</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Execute fund payouts and log disbursement reference IDs.
                </p>
              </div>
              <Link
                href="/dashboard/disbursement"
                className="mt-4 text-xs font-semibold text-[#0F766E] hover:text-[#0D655E] flex items-center gap-1"
              >
                <span>Open Disbursement Queue</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Collection */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <PiggyBank className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#14243A]">Loan Collection</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Record repayments by UTR and track balance until auto-closure.
                </p>
              </div>
              <Link
                href="/dashboard/collection"
                className="mt-4 text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>Open Collection Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Pending Underwriting Queue */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#14243A]">Pending Underwriting Queue</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest submissions awaiting the Sanction desk
              </p>
            </div>
            <Link
              href="/dashboard/sanction"
              className="text-xs text-[#0F766E] hover:underline font-semibold flex items-center gap-1"
            >
              <span>View All ({recentTasks.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No pending applications in the underwriting queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Applicant</th>
                    <th className="px-4 py-3">PAN</th>
                    <th className="px-4 py-3">Principal</th>
                    <th className="px-4 py-3">Tenure</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTasks.map((task) => (
                    <tr key={task._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3.5 font-bold text-[#14243A]">{task.fullName}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-500">{task.pan}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">
                        ₹{task.principalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{task.tenureDays} Days</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={task.status} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href="/dashboard/sanction"
                          className="px-2.5 py-1 text-xs font-semibold text-[#0F766E] hover:bg-teal-50 rounded transition"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
