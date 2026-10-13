'use client';

import React from 'react';
import { useAuth } from '@/lib/authContext';
import { Bell, LogOut } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="z-40 flex h-14 items-center justify-end border-b border-slate-200/90 bg-white px-3 shadow-xs sm:h-16 sm:px-6 md:sticky md:top-0">
      <div className="flex items-center gap-4">
        <button
          className="relative hidden rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 sm:inline-flex"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-[#0F766E] absolute top-1.5 right-1.5 ring-2 ring-white" />
        </button>

        <div className="hidden h-6 w-px bg-slate-200 sm:block" />

        {user && (
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#14243A] text-xs font-bold text-white">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[#14243A] leading-tight">{user.fullName}</span>
              <span className="text-[10px] text-slate-500 capitalize leading-tight">{user.role}</span>
            </div>
            <button
              onClick={logout}
              className="ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
