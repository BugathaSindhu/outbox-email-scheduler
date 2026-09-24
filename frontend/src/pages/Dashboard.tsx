import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ScheduledTable } from '../components/ScheduledTable';
import { SentTable } from '../components/SentTable';
import { SearchBar } from '../components/SearchBar';
import { ScheduledEmail } from '../types';
import api from '../services/api';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent' | 'search'>('scheduled');
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [sentEmails, setSentEmails] = useState<ScheduledEmail[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchSource, setSearchSource] = useState<string>('');

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [clientSearchQuery, setClientSearchQuery] = useState<string>('');

  const [loadingScheduled, setLoadingScheduled] = useState(true);
  const [loadingSent, setLoadingSent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = async () => {
    try {
      const [scheduledRes, sentRes] = await Promise.all([
        api.get('/emails/scheduled'),
        api.get('/emails/sent'),
      ]);
      setScheduledEmails(scheduledRes.data.scheduledEmails || []);
      setSentEmails(sentRes.data.sentEmails || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch live email status', err);
      setError('Failed to load email data from server.');
    } finally {
      setLoadingScheduled(false);
      setLoadingSent(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchResults = (results: any[], source: string) => {
    setSearchResults(results);
    setSearchSource(source);
    setActiveTab('search');
  };

  // Filter pipeline
  const filterList = (list: ScheduledEmail[]) => {
    return list.filter((email) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'SCHEDULED' && email.status !== 'SCHEDULED' && email.status !== 'RESCHEDULED') return false;
        if (statusFilter === 'PROCESSING' && email.status !== 'PROCESSING') return false;
        if (statusFilter === 'SENT' && email.status !== 'SENT') return false;
        if (statusFilter === 'FAILED' && email.status !== 'FAILED') return false;
      }

      // Date filter
      if (dateFilter !== 'ALL') {
        const targetDate = new Date(email.scheduledAt || email.sentAt || Date.now());
        const today = new Date();
        if (dateFilter === 'TODAY') {
          if (targetDate.toDateString() !== today.toDateString()) return false;
        } else if (dateFilter === 'TOMORROW') {
          const tomorrow = new Date();
          tomorrow.setDate(today.getDate() + 1);
          if (targetDate.toDateString() !== tomorrow.toDateString()) return false;
        } else if (dateFilter === 'UPCOMING') {
          if (targetDate.getTime() < today.getTime()) return false;
        }
      }

      // Search Query filter
      if (clientSearchQuery.trim()) {
        const q = clientSearchQuery.toLowerCase();
        const recipientMatch = email.recipient.toLowerCase().includes(q);
        const subjectMatch = email.subject.toLowerCase().includes(q);
        if (!recipientMatch && !subjectMatch) return false;
      }

      return true;
    });
  };

  const filteredScheduled = filterList(scheduledEmails);
  const filteredSent = filterList(sentEmails);

  return (
    <DashboardLayout>
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and monitor your scheduled emails.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/compose')}
            className="flex items-center justify-center gap-1.5 bg-[#0f172a] hover:bg-[#1e293b] active:bg-[#172554] text-white font-medium text-xs py-2 px-4 rounded-lg transition-colors duration-150 shadow-sm shadow-[#0f172a]/20"
          >
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
            <span>Compose</span>
          </button>
        </div>
      </section>

      {/* Section: Recent Scheduled Emails */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[#0f172a]">Recent Scheduled Emails</h2>
        </div>

        {/* Controls Bar */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          {/* Search Input */}
          <SearchBar
            onSearchResults={handleSearchResults}
            onClientFilterChange={(q) => setClientSearchQuery(q)}
          />

          {/* Filters & Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Dropdown */}
            <div className="relative inline-block text-left">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 pr-8 rounded-lg border border-slate-200 bg-white text-[#0f172a] font-medium text-xs focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">Status: All</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="PROCESSING">Processing</option>
                <option value="SENT">Sent</option>
                <option value="FAILED">Failed</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-2.5 text-slate-400 text-lg pointer-events-none">
                arrow_drop_down
              </span>
            </div>

            {/* Date Filter Dropdown */}
            <div className="relative inline-block text-left">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 px-3 pr-8 rounded-lg border border-slate-200 bg-white text-[#0f172a] font-medium text-xs focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">Date: All Time</option>
                <option value="TODAY">Today</option>
                <option value="TOMORROW">Tomorrow</option>
                <option value="UPCOMING">Upcoming</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-2.5 text-slate-400 text-lg pointer-events-none">
                arrow_drop_down
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'scheduled'
                ? 'bg-blue-50/70 text-[#0f172a] font-semibold border border-blue-200/80'
                : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            Scheduled Queue ({scheduledEmails.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'sent'
                ? 'bg-blue-50/70 text-[#0f172a] font-semibold border border-blue-200/80'
                : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            Sent History ({sentEmails.length})
          </button>
          {activeTab === 'search' && (
            <span className="px-3 py-1.5 rounded-lg text-xs bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
              Search Results ({searchResults.length})
            </span>
          )}
        </div>

        {/* Tab Content Tables */}
        {activeTab === 'scheduled' && (
          <ScheduledTable emails={filteredScheduled} loading={loadingScheduled} error={error} />
        )}

        {activeTab === 'sent' && (
          <SentTable emails={filteredSent} loading={loadingSent} error={error} />
        )}

        {activeTab === 'search' && (
          <div className="space-y-3">
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-3 text-xs text-[#1e3a8a] font-medium flex items-center justify-between">
              <span>
                Found {searchResults.length} matching document{searchResults.length !== 1 ? 's' : ''} via{' '}
                <strong className="uppercase">{searchSource}</strong>
              </span>
            </div>
            <SentTable emails={searchResults} loading={false} />
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};
