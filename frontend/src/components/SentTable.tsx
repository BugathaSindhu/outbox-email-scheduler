import React, { useState } from 'react';
import { ScheduledEmail } from '../types';

interface SentTableProps {
  emails: ScheduledEmail[];
  loading: boolean;
  error?: string | null;
}

export const SentTable: React.FC<SentTableProps> = ({ emails, loading, error }) => {
  const [selectedEmail, setSelectedEmail] = useState<ScheduledEmail | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-[#1e3a8a] border border-blue-200/80">
            Sent
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-[#0f172a] border border-slate-300">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-[#0f172a] border border-slate-300">
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
      <div className="bg-white border border-slate-200/90 rounded-lg p-12 text-center shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <span className="material-symbols-outlined text-2xl text-[#1e3a8a] animate-spin mb-2">progress_activity</span>
        <p className="text-xs font-medium text-slate-600">Loading sent email history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-900">
        <span className="material-symbols-outlined text-2xl mb-1">error_outline</span>
        <p className="font-semibold text-xs">{error}</p>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-lg p-12 text-center shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">mark_email_read</span>
        <h3 className="text-xs font-semibold text-[#0f172a]">No sent email history yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Dispatched emails will be recorded here with delivery timestamps and Ethereal SMTP preview links.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="h-9 bg-slate-50/90 border-b border-slate-200">
                <th className="px-4 font-medium text-[12px] text-slate-500 uppercase tracking-wider">Recipient</th>
                <th className="px-4 font-medium text-[12px] text-slate-500 uppercase tracking-wider">Subject</th>
                <th className="px-4 font-medium text-[12px] text-slate-500 uppercase tracking-wider">Sent Time</th>
                <th className="px-4 font-medium text-[12px] text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 font-medium text-[12px] text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {emails.map((email) => {
                const previewUrl = getPreviewUrl(email);
                return (
                  <tr key={email.id} className="h-11 hover:bg-blue-50/30 transition-colors duration-150">
                    <td className="px-4 text-xs font-medium text-[#0f172a]">{email.recipient}</td>
                    <td className="px-4 text-xs text-slate-600 max-w-xs truncate">{email.subject}</td>
                    <td className="px-4 text-xs text-slate-500">
                      {email.sentAt ? new Date(email.sentAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4">{getStatusBadge(email.status)}</td>
                    <td className="px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedEmail(email)}
                          className="text-xs font-medium text-slate-600 hover:text-[#1e3a8a] transition-colors"
                        >
                          View
                        </button>
                        {previewUrl && (
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-[#1e3a8a] hover:underline inline-flex items-center gap-0.5"
                          >
                            Preview
                            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="h-11 px-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-white">
          <span>Showing {emails.length} processed email{emails.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-1">
            <button className="h-7 w-7 rounded border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:text-[#0f172a] text-slate-600 disabled:opacity-40 transition-colors" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="h-7 w-7 rounded border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:text-[#0f172a] text-slate-600 disabled:opacity-40 transition-colors" disabled>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Email Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-[#0f172a]">Sent Email Details</h3>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong className="text-slate-700">Recipient:</strong> {selectedEmail.recipient}</p>
              <p><strong className="text-slate-700">Subject:</strong> {selectedEmail.subject}</p>
              <p><strong className="text-slate-700">Sent At:</strong> {selectedEmail.sentAt ? new Date(selectedEmail.sentAt).toLocaleString() : 'N/A'}</p>
              <p><strong className="text-slate-700">Status:</strong> {selectedEmail.status}</p>
              {getPreviewUrl(selectedEmail) && (
                <p>
                  <strong className="text-slate-700">Ethereal Preview:</strong>{' '}
                  <a
                    href={getPreviewUrl(selectedEmail)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Open SMTP Email Preview
                  </a>
                </p>
              )}
              <div className="pt-2">
                <strong className="text-slate-700 block mb-1">Body Content:</strong>
                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-slate-800 font-mono whitespace-pre-wrap">
                  {selectedEmail.body}
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-1.5 bg-[#0f172a] text-white rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
