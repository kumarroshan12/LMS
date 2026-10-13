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
    <div className="min-h-screen bg-[#F6F8FB] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
