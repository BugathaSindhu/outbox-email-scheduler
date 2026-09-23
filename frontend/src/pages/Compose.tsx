import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { CsvUploader } from '../components/CsvUploader';
import api from '../services/api';

export const Compose: React.FC = () => {
  const navigate = useNavigate();

  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientsText, setRecipientsText] = useState('');
  const [csvEmails, setCsvEmails] = useState<string[]>([]);

  const nowStr = new Date(Date.now() + 60000).toISOString().slice(0, 16);
  const [startTime, setStartTime] = useState(nowStr);
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(100);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getCombinedRecipients = (): string[] => {
    const textEmails = recipientsText
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && e.includes('@'));

    const combined = Array.from(new Set([...csvEmails, ...textEmails]));
    return combined;
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const recipients = getCombinedRecipients();

    if (recipients.length === 0) {
      setErrorMsg('Please upload a CSV or enter at least one valid recipient email address.');
      return;
    }

    if (!subject.trim()) {
      setErrorMsg('Please enter an email subject.');
      return;
    }

    if (!body.trim()) {
      setErrorMsg('Please enter the email body.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/emails/schedule', {
        name: campaignName.trim() || undefined,
        recipients,
        subject: subject.trim(),
        body: body.trim(),
        startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        delaySeconds: Number(delaySeconds),
        hourlyLimit: Number(hourlyLimit),
      });

      setSuccessMsg(`Successfully scheduled ${response.data.scheduledCount} emails!`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      const msg =
        err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Failed to schedule campaign.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const finalRecipients = getCombinedRecipients();

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-6 border-b border-[#c3c6d7]/60 pb-4">
        <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">Compose New Email</h1>
        <p className="text-[14px] text-[#434655] mt-1">Schedule emails to multiple recipients with rate limiting.</p>
      </div>

      {/* Feedback Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-800 text-[13px] font-medium flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-[#ffdad6] border border-[#ba1a1a] rounded-lg p-3 text-[#93000a] text-[13px] font-medium mb-4">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSchedule}>
        {/* Two-column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form Column (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            {/* SECTION 1: RECIPIENTS */}
            <section className="bg-white border border-[#c3c6d7] rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded bg-[#e5eeff] text-[#004ac6] flex items-center justify-center text-xs font-semibold">
                  1
                </span>
                <h2 className="text-[15px] font-semibold text-[#0b1c30]">Recipients</h2>
              </div>

              {/* Drag-and-drop CSV upload */}
              <CsvUploader onEmailsParsed={(emails) => setCsvEmails(emails)} />

              {/* Textarea Manual Recipient Input */}
              <div>
                <label className="block text-[12px] font-semibold text-[#434655] uppercase mb-1">
                  Or paste email addresses manually
                </label>
                <textarea
                  rows={3}
                  value={recipientsText}
                  onChange={(e) => setRecipientsText(e.target.value)}
                  placeholder="user1@company.com, user2@company.com..."
                  className="w-full px-3 py-2 bg-white border border-[#c3c6d7] rounded-lg text-[13px] text-[#0b1c30] placeholder:text-[#737686] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition"
                />
              </div>

              {finalRecipients.length > 0 && (
                <div className="mt-3 bg-[#e5eeff] border border-[#c3c6d7] rounded-lg p-2.5 px-3 text-[12px] text-[#004ac6] font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">group</span>
                  <span>{finalRecipients.length} unique recipient{finalRecipients.length !== 1 ? 's' : ''} ready to schedule.</span>
                </div>
              )}
            </section>

            {/* SECTION 2: EMAIL CONTENT */}
            <section className="bg-white border border-[#c3c6d7] rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded bg-[#e5eeff] text-[#004ac6] flex items-center justify-center text-xs font-semibold">
                  2
                </span>
                <h2 className="text-[15px] font-semibold text-[#0b1c30]">Email Content</h2>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#434655] uppercase mb-1">
                  Campaign Title (Optional)
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Weekly Product Updates"
                  className="w-full px-3 py-2 bg-white border border-[#c3c6d7] rounded-lg text-[13px] text-[#0b1c30] placeholder:text-[#737686] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#434655] uppercase mb-1">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Important updates for your team"
                  className="w-full px-3 py-2 bg-white border border-[#c3c6d7] rounded-lg text-[13px] text-[#0b1c30] placeholder:text-[#737686] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#434655] uppercase mb-1">
                  Email Body *
                </label>
                <textarea
                  rows={8}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Hello team,&#10;&#10;Here are the updates for this week..."
                  className="w-full px-3 py-2 bg-white border border-[#c3c6d7] rounded-lg text-[13px] font-mono text-[#0b1c30] placeholder:text-[#737686] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition"
                />
              </div>
            </section>
          </div>

          {/* Right Control Panel Column (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white border border-[#c3c6d7] rounded-lg p-5 shadow-sm space-y-4">
              <h3 className="text-[14px] font-semibold text-[#0b1c30] border-b border-[#c3c6d7]/60 pb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#2563eb]">tune</span>
                <span>Dispatch Controls</span>
              </h3>

              <div>
                <label className="block text-[12px] font-semibold text-[#434655] uppercase mb-1">
                  Start Dispatch Time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#c3c6d7] rounded-lg text-[13px] text-[#0b1c30] focus:border-[#2563eb] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#434655] uppercase mb-1">
                  Min Delay (Seconds)
                </label>
                <input
                  type="number"
                  min={0}
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#c3c6d7] rounded-lg text-[13px] text-[#0b1c30] focus:border-[#2563eb] outline-none"
                />
                <p className="text-[11px] text-[#737686] mt-0.5">Delay between consecutive sends</p>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#434655] uppercase mb-1">
                  Hourly Rate Limit
                </label>
                <input
                  type="number"
                  min={1}
                  value={hourlyLimit}
                  onChange={(e) => setHourlyLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#c3c6d7] rounded-lg text-[13px] text-[#0b1c30] focus:border-[#2563eb] outline-none"
                />
                <p className="text-[11px] text-[#737686] mt-0.5">Exceeded items are rescheduled</p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2563eb] hover:bg-[#004ac6] text-white font-semibold text-[13px] py-2.5 rounded-lg transition-colors duration-150 shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>{loading ? 'Scheduling Jobs...' : 'Schedule Campaign'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-white border border-[#c3c6d7] hover:bg-[#eff4ff] text-[#0b1c30] font-medium text-[13px] py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </section>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
};
