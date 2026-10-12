import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/authContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LendFlow — Enterprise Loan Management System',
  description: 'Enterprise Lending & Underwriting Platform powered by automated BRE and multi-module operations',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[#F6F8FB] text-[#14243A] antialiased flex flex-col`}>
        <AuthProvider>
          <div className="flex-1 flex flex-col">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
