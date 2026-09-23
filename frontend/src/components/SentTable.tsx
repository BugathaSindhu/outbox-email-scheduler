import React from 'react';
import { ScheduledEmail } from '../types';

interface SentTableProps {
  emails: ScheduledEmail[];
  loading: boolean;
  error?: string | null;
}

export const SentTable: React.FC<SentTableProps> = ({ emails, loading, error }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            Sent
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-800 border border-red-200">
            Failed
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

  const getPreviewUrl = (email: ScheduledEmail): string | null => {
    if (email.errorMessage && email.errorMessage.startsWith('Preview URL: ')) {
      return email.errorMessage.replace('Preview URL: ', '');
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#c3c6d7] rounded-lg p-12 text-center shadow-sm">
        <span className="material-symbols-outlined text-2xl text-[#2563eb] animate-spin mb-2">progress_activity</span>
        <p className="text-xs font-medium text-[#434655]">Loading sent email history...</p>
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
        <span className="material-symbols-outlined text-3xl text-gray-400 mb-2">mark_email_read</span>
        <h3 className="text-xs font-semibold text-[#0b1c30]">No sent email history yet</h3>
        <p className="text-[11px] text-[#434655] mt-1 max-w-sm mx-auto">
          Dispatched emails will be recorded here with delivery timestamps and Ethereal SMTP preview links.
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
              <th className="px-4 text-[12px] font-medium text-[#434655] uppercase tracking-wider">Sent Time</th>
              <th className="px-4 text-[12px] font-medium text-[#434655] uppercase tracking-wider">Status</th>
              <th className="px-4 text-[12px] font-medium text-[#434655] uppercase tracking-wider text-right">Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c3c6d7]/50">
            {emails.map((email) => {
              const previewUrl = getPreviewUrl(email);
              return (
                <tr key={email.id} className="h-11 hover:bg-[#eff4ff] transition-colors duration-150">
                  <td className="px-4 text-[13px] font-medium text-[#0b1c30]">{email.recipient}</td>
                  <td className="px-4 text-[13px] text-[#434655] max-w-xs truncate">{email.subject}</td>
                  <td className="px-4 text-[13px] text-[#434655]">
                    {email.sentAt ? new Date(email.sentAt).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-4">{getStatusBadge(email.status)}</td>
                  <td className="px-4 text-right">
                    {previewUrl ? (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] font-medium text-[#2563eb] hover:text-[#004ac6] inline-flex items-center gap-0.5"
                      >
                        View Email
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </a>
                    ) : (
                      <span className="text-[12px] text-gray-400">N/A</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="h-10 px-4 border-t border-[#c3c6d7] flex items-center justify-between text-[12px] text-[#434655] bg-white">
        <span>Showing {emails.length} processed item{emails.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};
