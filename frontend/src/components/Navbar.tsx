'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import {
  LogOut,
  Landmark,
  User,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'System Administrator';
      case 'sales':
        return 'Sales Executive';
      case 'sanction':
        return 'Sanction Officer';
      case 'disbursement':
        return 'Disbursement Officer';
      case 'collection':
        return 'Collection Officer';
      case 'borrower':
        return 'Borrower';
      default:
        return 'User';
    }
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-900/40 text-purple-200 border-purple-700/50';
      case 'sales':
        return 'bg-blue-900/40 text-blue-200 border-blue-700/50';
      case 'sanction':
        return 'bg-amber-900/40 text-amber-200 border-amber-700/50';
      case 'disbursement':
        return 'bg-emerald-900/40 text-emerald-200 border-emerald-700/50';
      case 'collection':
        return 'bg-teal-900/40 text-teal-200 border-teal-700/50';
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
                  Lending Platform
                </span>
              </div>
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-800">
                {user.role === 'borrower' ? (
                  <Link
                    href="/borrower"
                    className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-colors ${
                      pathname.startsWith('/borrower')
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    My Loan Application
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-colors ${
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

          {/* Right Navigation & Profile */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {/* User Role Badge */}
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium border tracking-wide ${getRoleBadgeStyle(
                    user.role
                  )}`}
                >
                  {getRoleLabel(user.role)}
                </span>

                {/* Profile info */}
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white leading-tight">{user.fullName}</span>
                  <span className="text-[10px] text-slate-400 leading-tight">{user.email}</span>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1.5 rounded-md border border-slate-700/60 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition shadow-sm"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
