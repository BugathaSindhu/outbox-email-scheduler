import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { CsvUploader } from '../components/CsvUploader';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const Compose: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientsText, setRecipientsText] = useState('');
  const [csvEmails, setCsvEmails] = useState<string[]>([]);
  const [selectedSender, setSelectedSender] = useState<string>(user?.email || 'sarah@outboxhq.com');

  const nowStr = new Date(Date.now() + 60000).toISOString().slice(0, 16);
  const [startTime, setStartTime] = useState(nowStr);
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(500);

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

  const formattedStartTime = startTime
    ? new Date(startTime).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : 'Immediate';

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-6 border-b border-slate-200/80 pb-6">
        <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Compose New Email</h1>
        <p className="text-sm text-slate-500 mt-1">Schedule emails to multiple recipients.</p>
      </div>

      {/* Feedback Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-800 text-xs font-medium flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-900 text-xs font-medium mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-600 text-base">error_outline</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSchedule}>
        {/* Two-column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form Column (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            {/* SECTION 1: RECIPIENTS */}
            <section className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-slate-100 text-[#0f172a] flex items-center justify-center text-xs font-bold border border-slate-200">
                    1
                  </span>
                  <h2 className="text-base font-bold text-[#0f172a]">Recipients</h2>
                </div>
              </div>

              {/* Drag-and-drop CSV Upload Component */}
              <CsvUploader onEmailsParsed={(emails) => setCsvEmails(emails)} />

              {/* Manual Email Input Fallback */}
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                  Or enter email addresses manually
                </label>
                <textarea
                  rows={3}
                  value={recipientsText}
                  onChange={(e) => setRecipientsText(e.target.value)}
                  placeholder="user1@company.com, user2@company.com..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-[#0f172a] placeholder:text-slate-400 focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a] outline-none transition-all shadow-xs"
                />
              </div>

              {finalRecipients.length > 0 && (
                <div className="mt-3 bg-blue-50/70 border border-blue-200/80 rounded-lg p-3 text-xs text-[#1e3a8a] font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  <span>{finalRecipients.length} recipient{finalRecipients.length !== 1 ? 's' : ''} queued for dispatch.</span>
                </div>
              )}
            </section>

            {/* SECTION 2: EMAIL CONTENT */}
            <section className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-slate-100 text-[#0f172a] flex items-center justify-center text-xs font-bold border border-slate-200">
                    2
                  </span>
                  <h2 className="text-base font-bold text-[#0f172a]">Email Content</h2>
                </div>
              </div>

              <div className="space-y-4">
                {/* Sender Select */}
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1.5" htmlFor="sender-select">
                    Sender
                  </label>
                  <div className="relative">
                    <select
                      id="sender-select"
                      value={selectedSender}
                      onChange={(e) => setSelectedSender(e.target.value)}
                      className="w-full h-9 pl-3 pr-9 bg-white border border-slate-200 rounded-lg text-sm text-[#0f172a] focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a] outline-none transition-all cursor-pointer shadow-xs"
                    >
                      <option value={user?.email || 'sarah@outboxhq.com'}>
                        {user?.email || 'sarah@outboxhq.com'} ({user?.name || 'Sarah Jenkins'})
                      </option>
                      <option value="alex@company.com">alex@company.com (Alex Morgan)</option>
                    </select>
                  </div>
                </div>

                {/* Campaign Name (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1.5" htmlFor="campaign-name">
                    Campaign Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="campaign-name"
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. Q4 Architecture Update"
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-[#0f172a] placeholder:text-slate-400 focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a] outline-none transition-all shadow-xs"
                  />
                </div>

                {/* Subject Line */}
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1.5" htmlFor="subject-input">
                    Subject line <span className="text-[#0f172a]">*</span>
                  </label>
                  <input
                    id="subject-input"
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Product Architecture Update - Q4 Rollout"
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-[#0f172a] placeholder:text-slate-400 focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a] outline-none transition-all shadow-xs"
                  />
                </div>

                {/* Email Body Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#0f172a]" htmlFor="email-body">
                      Email Body
                    </label>
                    <span className="text-xs text-slate-400">Markdown & plain text supported</span>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:border-[#0f172a] focus-within:ring-1 focus-within:ring-[#0f172a] shadow-xs">
                    <div className="h-8 bg-slate-50 border-b border-slate-200 px-2 flex items-center gap-1 text-slate-600">
                      <button type="button" className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 hover:text-[#0f172a] text-xs font-bold font-mono transition-colors">B</button>
                      <button type="button" className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 hover:text-[#0f172a] text-xs italic font-mono transition-colors">I</button>
                      <button type="button" className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 hover:text-[#0f172a] text-xs font-mono transition-colors">&lt;&gt;</button>
                      <span className="w-[1px] h-4 bg-slate-300 mx-1"></span>
                      <button type="button" className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 hover:text-[#0f172a] transition-colors">
                        <span className="material-symbols-outlined text-[16px]">link</span>
                      </button>
                      <button type="button" className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 hover:text-[#0f172a] transition-colors">
                        <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
                      </button>
                    </div>
                    <textarea
                      id="email-body"
                      rows={8}
                      required
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Write your email body here..."
                      className="w-full p-3.5 bg-white border-0 text-sm text-[#0f172a] placeholder:text-slate-400 focus:ring-0 outline-none resize-y leading-relaxed font-normal"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Summary Card, Schedule & Rate Limits, Action Buttons */}
          <div className="lg:col-span-4 sticky top-20 space-y-6">
            {/* SECTION 4: EMAIL SUMMARY CARD */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
                <h3 className="text-base font-bold text-[#0f172a]">Email Summary</h3>
              </div>
              <dl className="space-y-2 text-xs">
                {/* Recipients */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500 font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#1e3a8a]">group</span>
                    <span>Recipients</span>
                  </dt>
                  <dd className="font-mono font-bold text-[#0f172a]">{finalRecipients.length}</dd>
                </div>
                {/* Sender */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500 font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#1e3a8a]">alternate_email</span>
                    <span>Sender</span>
                  </dt>
                  <dd className="font-medium text-[#0f172a] text-right truncate max-w-[170px]" title={selectedSender}>
                    {selectedSender}
                  </dd>
                </div>
                {/* Start Time */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500 font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#1e3a8a]">event</span>
                    <span>Start Time</span>
                  </dt>
                  <dd className="font-medium text-[#0f172a] text-right">{formattedStartTime}</dd>
                </div>
                {/* Delay */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500 font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#1e3a8a]">timelapse</span>
                    <span>Delay</span>
                  </dt>
                  <dd className="font-medium text-[#0f172a]">{delaySeconds} seconds</dd>
                </div>
                {/* Hourly Limit */}
                <div className="flex items-center justify-between py-1.5">
                  <dt className="text-slate-500 font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#1e3a8a]">tune</span>
                    <span>Hourly Limit</span>
                  </dt>
                  <dd className="font-medium text-[#0f172a]">{hourlyLimit}/hour</dd>
                </div>
              </dl>
            </div>

            {/* SECTION 3: SCHEDULE & RATE LIMITS */}
            <section className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-slate-100 text-[#0f172a] flex items-center justify-center text-xs font-bold border border-slate-200">
                    3
                  </span>
                  <h2 className="text-base font-bold text-[#0f172a]">Schedule & Rate Limits</h2>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1.5" htmlFor="start-time-input">
                    Start Time
                  </label>
                  <div className="relative">
                    <input
                      id="start-time-input"
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-[#0f172a] focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a] outline-none transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1.5" htmlFor="delay-input">
                    Delay Between Emails
                  </label>
                  <div className="relative">
                    <input
                      id="delay-input"
                      type="number"
                      min={0}
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(Number(e.target.value))}
                      className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-[#0f172a] focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a] outline-none transition-all shadow-xs"
                    />
                    <span className="material-symbols-outlined absolute right-2.5 top-2 text-[#1e3a8a] pointer-events-none text-[18px]">
                      timer
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">Minimum delay between individual emails (seconds).</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1.5" htmlFor="limit-input">
                    Hourly Sending Limit
                  </label>
                  <div className="relative">
                    <input
                      id="limit-input"
                      type="number"
                      min={1}
                      value={hourlyLimit}
                      onChange={(e) => setHourlyLimit(Number(e.target.value))}
                      className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-[#0f172a] focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a] outline-none transition-all shadow-xs"
                    />
                    <span className="material-symbols-outlined absolute right-2.5 top-2 text-[#1e3a8a] pointer-events-none text-[18px]">
                      speed
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">Maximum number of emails sent per hour.</p>
                </div>
              </div>
            </section>

            {/* Form Actions / Primary CTA */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="h-9 px-4 bg-white border border-slate-200 rounded-lg font-medium text-xs text-slate-700 hover:bg-slate-50 hover:text-[#0f172a] hover:border-slate-300 transition-colors duration-150 inline-flex items-center justify-center whitespace-nowrap shadow-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="h-9 px-5 bg-[#0f172a] hover:bg-[#172554] active:bg-[#1e293b] text-white font-medium text-xs rounded-lg transition-colors duration-150 shadow-sm shadow-slate-900/15 flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[17px]">schedule_send</span>
                <span>{loading ? 'Scheduling...' : 'Schedule Campaign'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
};
