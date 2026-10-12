import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-[#0F766E] transition flex items-center gap-1">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            {isLast || !item.href ? (
              <span className="font-semibold text-[#14243A]">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-[#0F766E] transition">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
