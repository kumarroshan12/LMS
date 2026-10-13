'use client';

import React from 'react';
import { useAuth } from '@/lib/authContext';
import { Bell, LogOut } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-end sticky top-0 z-40 shadow-xs">
      <div className="flex items-center gap-4">
        <button
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-[#0F766E] absolute top-1.5 right-1.5 ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        {user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#14243A] text-white flex items-center justify-center font-bold text-xs">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[#14243A] leading-tight">{user.fullName}</span>
              <span className="text-[10px] text-slate-500 capitalize leading-tight">{user.role}</span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
