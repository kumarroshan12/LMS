'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/authContext';
import {
  ShieldCheck,
  LogOut,
  Building2,
  ChevronDown,
  UserCheck,
  Landmark,
  Coins,
  BadgeDollarSign,
  User,
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout, quickLoginAsRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [switching, setSwitching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleRoleSwitch = async (role: UserRole) => {
    try {
      setSwitching(true);
      await quickLoginAsRole(role);
      setDropdownOpen(false);
      if (role === 'borrower') {
        router.push('/borrower');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSwitching(false);
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-900/60 text-purple-200 border-purple-700/50';
      case 'sales':
        return 'bg-blue-900/60 text-blue-200 border-blue-700/50';
      case 'sanction':
        return 'bg-amber-900/60 text-amber-200 border-amber-700/50';
      case 'disbursement':
        return 'bg-emerald-900/60 text-emerald-200 border-emerald-700/50';
      case 'collection':
        return 'bg-teal-900/60 text-teal-200 border-teal-700/50';
      case 'borrower':
        return 'bg-slate-800 text-slate-200 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <nav className="bg-[#0B192C] border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight flex items-center gap-1 text-white">
                  LMS<span className="text-emerald-400 font-semibold text-sm">Fintech</span>
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                  Loan Engine
                </span>
              </div>
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-800">
                {user.role === 'borrower' ? (
                  <Link
                    href="/borrower"
                    className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${
                      pathname.startsWith('/borrower')
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    Borrower Application & Status
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${
                      pathname.startsWith('/dashboard')
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    Operations Workbench
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Right Controls & Quick Role Switcher */}
          <div className="flex items-center gap-4">
            {/* Quick Demo Role Switcher for Evaluators */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                disabled={switching}
                className="flex items-center gap-2 text-xs bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-md border border-slate-700/80 transition shadow-sm"
                title="Quickly test any role for assignment review"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline font-medium">
                  {switching ? 'Switching...' : 'Evaluator Quick-Switch'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                    Switch User Role (Password: Password@123)
                  </div>
                  {[
                    { role: 'admin' as UserRole, label: 'Super Admin', desc: 'All 4 modules access' },
                    { role: 'sales' as UserRole, label: 'Sales Exec', desc: 'Pre-application Leads' },
                    { role: 'sanction' as UserRole, label: 'Sanction Officer', desc: 'Review & Approve/Reject' },
                    { role: 'disbursement' as UserRole, label: 'Disbursement Officer', desc: 'Release Funds' },
                    { role: 'collection' as UserRole, label: 'Collection Officer', desc: 'Record UTR & Close' },
                    { role: 'borrower' as UserRole, label: 'Borrower', desc: 'Apply & Track Loan' },
                  ].map((item) => (
                    <button
                      key={item.role}
                      onClick={() => handleRoleSwitch(item.role)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 flex flex-col transition border-b border-slate-800/40 last:border-none"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white capitalize">{item.label}</span>
                        {user?.role === item.role && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{item.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                {/* Active Role Badge */}
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border uppercase tracking-wider ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>

                {/* User Details */}
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white leading-tight">{user.fullName}</span>
                  <span className="text-[10px] text-slate-400 leading-tight">{user.email}</span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-md transition shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
