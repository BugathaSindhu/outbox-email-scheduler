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

  const countScheduled = scheduledEmails.filter((e) => e.status === 'SCHEDULED' || e.status === 'PROCESSING' || e.status === 'RESCHEDULED').length;
  const countSent = sentEmails.filter((e) => e.status === 'SENT').length;
  const countFailed = sentEmails.filter((e) => e.status === 'FAILED').length;

  return (
    <DashboardLayout>
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">Dashboard</h1>
          <p className="text-[14px] text-[#434655] mt-1">Manage and monitor your scheduled email operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/compose')}
            className="bg-[#2563eb] hover:bg-[#004ac6] text-white font-medium text-[13px] h-9 px-4 rounded-lg transition-colors duration-150 shadow-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Compose New Email</span>
          </button>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scheduled Emails */}
        <div className="bg-white border border-[#c3c6d7] rounded-lg p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#434655]">Scheduled Emails</span>
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#004ac6] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">schedule_send</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[30px] font-semibold text-[#0b1c30] tracking-tight">{countScheduled}</div>
          </div>
        </div>

        {/* Sent Emails */}
        <div className="bg-white border border-[#c3c6d7] rounded-lg p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#434655]">Sent Emails</span>
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#004ac6] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">mark_email_read</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[30px] font-semibold text-[#0b1c30] tracking-tight">{countSent}</div>
          </div>
        </div>

        {/* Failed Emails */}
        <div className="bg-white border border-[#c3c6d7] rounded-lg p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#434655]">Failed Emails</span>
            <div className="w-8 h-8 rounded-lg bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">error_outline</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[30px] font-semibold text-[#0b1c30] tracking-tight">{countFailed}</div>
          </div>
        </div>

        {/* Active Senders */}
        <div className="bg-white border border-[#c3c6d7] rounded-lg p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#434655]">Active Senders</span>
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#004ac6] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">alternate_email</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[30px] font-semibold text-[#0b1c30] tracking-tight">1</div>
          </div>
        </div>
      </section>

      {/* Main Table Section */}
      <section className="flex flex-col gap-4">
        {/* Controls Bar & Tabs */}
        <div className="bg-white border border-[#c3c6d7] rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                activeTab === 'scheduled'
                  ? 'bg-[#e5eeff] text-[#004ac6] font-semibold'
                  : 'text-[#434655] hover:bg-[#eff4ff]'
              }`}
            >
              Scheduled Queue ({scheduledEmails.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'bg-[#e5eeff] text-[#004ac6] font-semibold'
                  : 'text-[#434655] hover:bg-[#eff4ff]'
              }`}
            >
              Sent History ({sentEmails.length})
            </button>
            {activeTab === 'search' && (
              <span className="px-3 py-1.5 rounded-lg text-[13px] bg-purple-50 text-purple-700 font-semibold">
                Search Results ({searchResults.length})
              </span>
            )}
          </div>

          {/* Search Input Component */}
          <SearchBar onSearchResults={handleSearchResults} />
        </div>

        {/* Tab Content */}
        {activeTab === 'scheduled' && (
          <ScheduledTable emails={scheduledEmails} loading={loadingScheduled} error={error} />
        )}

        {activeTab === 'sent' && (
          <SentTable emails={sentEmails} loading={loadingSent} error={error} />
        )}

        {activeTab === 'search' && (
          <div className="space-y-3">
            <div className="bg-[#e5eeff] border border-[#c3c6d7] rounded-lg p-2.5 px-4 text-[12px] text-[#004ac6] font-medium flex items-center justify-between">
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
