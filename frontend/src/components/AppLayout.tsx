'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/authContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { RefreshCw } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.replace('/');
        return;
      }

      if (allowedRoles && allowedRoles.length > 0) {
        const isAuthorized =
          allowedRoles.includes(user.role) ||
          (user.role === 'admin' && allowedRoles.some((r) => r !== 'borrower'));

        if (!isAuthorized) {
          router.push('/access-denied');
        }
      }
    }
  }, [user, loading, allowedRoles, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-[#0F766E] mr-2" />
        <span className="text-xs font-medium">Securing session...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-[#F6F8FB] md:flex-row">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
