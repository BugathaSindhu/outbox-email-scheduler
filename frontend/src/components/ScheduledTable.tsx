import React from 'react';
import { ScheduledEmail } from '../types';

interface ScheduledTableProps {
  emails: ScheduledEmail[];
  loading: boolean;
  error?: string | null;
}

export const ScheduledTable: React.FC<ScheduledTableProps> = ({ emails, loading, error }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
            Scheduled
          </span>
        );
      case 'RESCHEDULED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
            Rescheduled
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
            Processing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#c3c6d7] rounded-lg p-12 text-center shadow-sm">
        <span className="material-symbols-outlined text-2xl text-[#2563eb] animate-spin mb-2">progress_activity</span>
        <p className="text-xs font-medium text-[#434655]">Loading scheduled email queue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#ffdad6] border border-[#ba1a1a] rounded-lg p-6 text-center text-[#93000a]">
        <span className="material-symbols-outlined text-2xl mb-1">error_outline</span>
        <p className="font-semibold text-xs">{error}</p>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-white border border-[#c3c6d7] rounded-lg p-12 text-center shadow-sm">
        <span className="material-symbols-outlined text-3xl text-gray-400 mb-2">schedule_send</span>
        <h3 className="text-xs font-semibold text-[#0b1c30]">No scheduled emails pending</h3>
        <p className="text-[11px] text-[#434655] mt-1 max-w-sm mx-auto">
          When you compose and schedule an email campaign, queued dispatches will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#c3c6d7] rounded-lg overflow-hidden shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="h-9 bg-[#eff4ff] border-b border-[#c3c6d7]">
              <th className="px-4 text-[12px] font-medium text-[#434655] uppercase tracking-wider">Recipient</th>
              <th className="px-4 text-[12px] font-medium text-[#434655] uppercase tracking-wider">Subject</th>
              <th className="px-4 text-[12px] font-medium text-[#434655] uppercase tracking-wider">Scheduled Time</th>
              <th className="px-4 text-[12px] font-medium text-[#434655] uppercase tracking-wider">Status</th>
              <th className="px-4 text-[12px] font-medium text-[#434655] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c3c6d7]/50">
            {emails.map((email) => (
              <tr key={email.id} className="h-11 hover:bg-[#eff4ff] transition-colors duration-150">
                <td className="px-4 text-[13px] font-medium text-[#0b1c30]">{email.recipient}</td>
                <td className="px-4 text-[13px] text-[#434655] max-w-xs truncate">{email.subject}</td>
                <td className="px-4 text-[13px] text-[#434655]">
                  {new Date(email.scheduledAt).toLocaleString()}
                </td>
                <td className="px-4">{getStatusBadge(email.status)}</td>
                <td className="px-4 text-right">
                  <span className="text-[12px] text-[#434655]">Enqueued</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="h-10 px-4 border-t border-[#c3c6d7] flex items-center justify-between text-[12px] text-[#434655] bg-white">
        <span>Showing {emails.length} scheduled item{emails.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};
