'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import {
  Landmark,
  LayoutDashboard,
  FilePlus,
  Files,
  Users,
  FileCheck2,
  Send,
  PiggyBank,
  LogOut,
  Shield,
  Layers,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const isBorrower = user.role === 'borrower';
  const isAdmin = user.role === 'admin';

  return (
    <aside className="w-64 bg-[#14243A] text-white flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-[#0F766E] flex items-center justify-center text-white shadow-md shadow-teal-900/40">
          <Landmark className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-tight text-white flex items-center gap-1">
            Lend<span className="text-[#14B8A6]">Flow</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
            {isBorrower ? 'Customer Portal' : 'Operations Desk'}
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
        {/* Borrower Navigation */}
        {isBorrower && (
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Borrower Navigation
            </span>

            <Link
              href="/borrower"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                pathname === '/borrower'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Borrower Dashboard</span>
            </Link>

            <Link
              href="/borrower/apply"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                pathname === '/borrower/apply'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <FilePlus className="w-4 h-4" />
              <span>Apply for a Loan</span>
            </Link>

            <Link
              href="/borrower/loans"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                pathname.startsWith('/borrower/loans')
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Files className="w-4 h-4" />
              <span>My Loans & Repayment</span>
            </Link>
          </div>
        )}

        {/* Employee Operations Navigation */}
        {!isBorrower && (
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Operations Modules
            </span>

            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                pathname === '/dashboard'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Operations Overview</span>
            </Link>

            {(isAdmin || user.role === 'sales') && (
              <Link
                href="/dashboard/sales"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  pathname === '/dashboard/sales'
                    ? 'bg-[#0F766E] text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Sales Leads</span>
              </Link>
            )}

            {(isAdmin || user.role === 'sanction') && (
              <Link
                href="/dashboard/sanction"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  pathname === '/dashboard/sanction'
                    ? 'bg-[#0F766E] text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Loan Sanction</span>
              </Link>
            )}

            {(isAdmin || user.role === 'disbursement') && (
              <Link
                href="/dashboard/disbursement"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  pathname === '/dashboard/disbursement'
                    ? 'bg-[#0F766E] text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Loan Disbursement</span>
              </Link>
            )}

            {(isAdmin || user.role === 'collection') && (
              <Link
                href="/dashboard/collection"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  pathname === '/dashboard/collection'
                    ? 'bg-[#0F766E] text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <PiggyBank className="w-4 h-4" />
                <span>Loan Collection</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-[#0E1A2B]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-xs font-semibold text-white truncate">{user.fullName}</span>
            <span className="text-[10px] text-slate-400 capitalize">{user.role} Account</span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
