'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Files,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  FilePlus,
  Eye,
} from 'lucide-react';

interface LoanRecord {
  _id: string;
  fullName: string;
  pan: string;
  principalAmount: number;
  tenureDays: number;
  interestRate: number;
  interestAmount: number;
  totalRepayment: number;
  totalPaid: number;
  balanceRemaining: number;
  status: string;
  createdAt: string;
}

export default function MyLoansPage() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const hasActiveApplication = loans.some((loan) =>
    ['APPLIED', 'SANCTIONED', 'DISBURSED'].includes(loan.status)
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<LoanRecord[]>('/borrower/my-loans');
      if (res.success && res.data) {
        setLoans(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Search
  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.pan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.fullName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || loan.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage) || 1;
  const paginatedLoans = filteredLoans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AppLayout allowedRoles={['borrower']}>
      <div className="space-y-6">
        <Breadcrumbs
          items={[{ label: 'Borrower', href: '/borrower' }, { label: 'My Loans & Applications' }]}
        />

        {/* Page Header */}
        <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="break-words text-lg font-bold text-[#14243A] sm:text-xl">My Loan Applications</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review all historical and active loan records, sanction status, and repayment ledgers
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLoans}
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
              <span>New Application</span>
            </Link>}
          </div>
        </div>

        {/* Filter Controls */}
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="relative w-full flex-1 sm:max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, PAN, or Name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {['ALL', 'APPLIED', 'SANCTIONED', 'DISBURSED', 'CLOSED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  statusFilter === st
                    ? 'bg-[#14243A] text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0F766E] mb-2" />
              <span>Fetching loan accounts...</span>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2">
              <Files className="w-8 h-8 mx-auto text-slate-300" />
              <p>No loan applications found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Loan ID</th>
                    <th className="px-5 py-3.5">Principal</th>
                    <th className="px-5 py-3.5">Tenure</th>
                    <th className="px-5 py-3.5">Total Repayment</th>
                    <th className="px-5 py-3.5">Balance Remaining</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Date Applied</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedLoans.map((loan) => (
                    <tr key={loan._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-4 font-mono font-bold text-[#14243A]">
                        #{loan._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        ₹{loan.principalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{loan.tenureDays} Days</td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        ₹{loan.totalRepayment.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 font-bold text-[#0F766E]">
                        ₹{loan.balanceRemaining.toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={loan.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {new Date(loan.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/borrower/loans/${loan._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-[#0F766E] hover:text-white text-slate-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredLoans.length > itemsPerPage && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:px-6">
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredLoans.length)} of {filteredLoans.length}{' '}
                records
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-2 font-bold text-[#14243A]">
                  {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
