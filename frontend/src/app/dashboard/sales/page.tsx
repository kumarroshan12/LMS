'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StatusBadge } from '@/components/StatusBadge';
import { Users, Search, RefreshCw, Mail, Phone, Calendar } from 'lucide-react';

interface LeadUser {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export default function SalesManagementPage() {
  const [leads, setLeads] = useState<LeadUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<LeadUser[]>('/operations/sales/leads');
      if (res.success && res.data) {
        setLeads(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.phone && lead.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AppLayout allowedRoles={['sales', 'admin']}>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Operations Desk', href: '/dashboard' },
            { label: 'Sales Management' },
          ]}
        />

        {/* Page Header */}
          <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-lg font-bold text-[#14243A] sm:text-xl">Sales Management — Lead Tracking</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {leads.length} Leads
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracking registered borrowers who have signed up but have not yet submitted a formal loan application
            </p>
          </div>

          <button
            onClick={fetchLeads}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Leads</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4">
          <div className="relative w-full flex-1 sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] text-slate-800"
            />
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Showing {paginatedLeads.length} of {filteredLeads.length} total
          </span>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0F766E] mb-2" />
              <span>Fetching sales leads...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-300" />
              <p>No unapplied leads found in the pipeline.</p>
            </div>
          ) : (
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Lead Name</th>
                    <th className="px-5 py-3.5">Email Address</th>
                    <th className="px-5 py-3.5">Contact Phone</th>
                    <th className="px-5 py-3.5">Registered Date</th>
                    <th className="px-5 py-3.5 text-right">Lead Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedLeads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-4 font-bold text-[#14243A]">{lead.fullName}</td>
                      <td className="px-5 py-4 text-slate-600 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lead.email}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lead.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <StatusBadge status="LEAD" size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredLeads.length > itemsPerPage && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:px-6">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
