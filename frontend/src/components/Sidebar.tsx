'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, User, UserRole } from '@/lib/authContext';
import { apiRequest } from '@/lib/api';
import {
  FileCheck2,
  FilePlus,
  Files,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Send,
  Users,
  X,
} from 'lucide-react';

interface NavigationProps {
  user: User;
  pathname: string;
  hasActiveApplication: boolean | null;
  onNavigate?: () => void;
}

const SidebarNavigation: React.FC<NavigationProps> = ({
  user,
  pathname,
  hasActiveApplication,
  onNavigate,
}) => {
  const isBorrower = user.role === 'borrower';
  const isAdmin = user.role === 'admin';
  const linkClass = (active: boolean) =>
    `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
      active
        ? 'bg-[#0F766E] text-white shadow-sm'
        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
    }`;

  return (
    <nav className="space-y-6" aria-label="Main navigation">
      {isBorrower ? (
        <div className="space-y-1">
          <span className="mb-2 block px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Borrower Navigation
          </span>
          <Link href="/borrower" onClick={onNavigate} className={linkClass(pathname === '/borrower')}>
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span>Borrower Dashboard</span>
          </Link>
          {hasActiveApplication === false && (
            <Link href="/borrower/apply" onClick={onNavigate} className={linkClass(pathname === '/borrower/apply')}>
              <FilePlus className="h-4 w-4 shrink-0" />
              <span>Apply for a Loan</span>
            </Link>
          )}
          <Link
            href="/borrower/loans"
            onClick={onNavigate}
            className={linkClass(pathname.startsWith('/borrower/loans'))}
          >
            <Files className="h-4 w-4 shrink-0" />
            <span>My Loans &amp; Repayment</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-1">
          <span className="mb-2 block px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Operations Modules
          </span>
          {isAdmin && (
            <Link href="/dashboard" onClick={onNavigate} className={linkClass(pathname === '/dashboard')}>
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>Admin Overview</span>
            </Link>
          )}
          {canOpen(user.role, 'sales') && (
            <Link href="/dashboard/sales" onClick={onNavigate} className={linkClass(pathname === '/dashboard/sales')}>
              <Users className="h-4 w-4 shrink-0" />
              <span>Sales Leads</span>
            </Link>
          )}
          {canOpen(user.role, 'sanction') && (
            <Link href="/dashboard/sanction" onClick={onNavigate} className={linkClass(pathname === '/dashboard/sanction')}>
              <FileCheck2 className="h-4 w-4 shrink-0" />
              <span>Loan Sanction</span>
            </Link>
          )}
          {canOpen(user.role, 'disbursement') && (
            <Link href="/dashboard/disbursement" onClick={onNavigate} className={linkClass(pathname === '/dashboard/disbursement')}>
              <Send className="h-4 w-4 shrink-0" />
              <span>Loan Disbursement</span>
            </Link>
          )}
          {canOpen(user.role, 'collection') && (
            <Link href="/dashboard/collection" onClick={onNavigate} className={linkClass(pathname === '/dashboard/collection')}>
              <PiggyBank className="h-4 w-4 shrink-0" />
              <span>Loan Collection</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

function canOpen(role: UserRole, module: 'sales' | 'sanction' | 'disbursement' | 'collection') {
  return role === 'admin' || role === module;
}

const Brand: React.FC<{ isBorrower: boolean }> = ({ isBorrower }) => (
  <div className="flex min-w-0 items-center gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0F766E] text-white shadow-md shadow-teal-900/40">
      <Landmark className="h-5 w-5" />
    </div>
    <div className="flex min-w-0 flex-col">
      <span className="flex items-center gap-1 text-base font-bold tracking-tight text-white">
        Lend<span className="text-[#14B8A6]">Flow</span>
      </span>
      <span className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400">
        {isBorrower ? 'Customer Portal' : 'Operations Desk'}
      </span>
    </div>
  </div>
);

const AccountFooter: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => (
  <div className="border-t border-slate-800 bg-[#0E1A2B] p-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col pr-2">
        <span className="truncate text-xs font-semibold text-white">{user.fullName}</span>
        <span className="text-[10px] capitalize text-slate-400">{user.role} Account</span>
      </div>
      <button
        onClick={onLogout}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-rose-400"
        title="Sign Out"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  </div>
);

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [hasActiveApplication, setHasActiveApplication] = useState<boolean | null>(null);
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null);
  const mobileOpen = mobileOpenPath === pathname;

  useEffect(() => {
    if (user?.role !== 'borrower') {
      return;
    }

    let isCurrent = true;
    apiRequest<Array<{ status: string }>>('/borrower/my-loans')
      .then((res) => {
        if (isCurrent) {
          setHasActiveApplication(Boolean(res.data?.some((loan) =>
            ['APPLIED', 'SANCTIONED', 'DISBURSED'].includes(loan.status)
          )));
        }
      })
      .catch(() => {
        if (isCurrent) setHasActiveApplication(true);
      });
    return () => { isCurrent = false; };
  }, [user?.role, pathname]);

  if (!user) return null;

  return (
    <>
      <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-[#14243A] text-white md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
          <Brand isBorrower={user.role === 'borrower'} />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-6">
          <SidebarNavigation user={user} pathname={pathname} hasActiveApplication={hasActiveApplication} />
        </div>
        <AccountFooter user={user} onLogout={logout} />
      </aside>

      <div className="sticky top-0 z-50 bg-[#14243A] text-white shadow-md md:hidden">
        <div className="flex h-14 items-center justify-between gap-3 border-b border-slate-800 px-4">
          <Brand isBorrower={user.role === 'borrower'} />
          <button
            type="button"
            onClick={() => setMobileOpenPath(mobileOpen ? null : pathname)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-200 transition hover:bg-slate-800"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div id="mobile-navigation" className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-slate-700">
            <div className="px-3 py-4">
              <SidebarNavigation
                user={user}
                pathname={pathname}
                hasActiveApplication={hasActiveApplication}
                onNavigate={() => setMobileOpenPath(null)}
              />
            </div>
            <AccountFooter user={user} onLogout={logout} />
          </div>
        )}
      </div>
    </>
  );
};
