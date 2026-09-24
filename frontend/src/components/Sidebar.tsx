import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { BULL_BOARD_URL } from '../services/api';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, slackStatus, refreshSlackStatus } = useAuth();

  const [scheduledCount, setScheduledCount] = useState<number>(0);
  const [sentCount, setSentCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);

  const fetchCounts = async () => {
    try {
      const [scheduledRes, sentRes] = await Promise.all([
        api.get('/emails/scheduled'),
        api.get('/emails/sent'),
      ]);
      const schedList = scheduledRes.data.scheduledEmails || [];
      const sentList = sentRes.data.sentEmails || [];

      setScheduledCount(schedList.filter((e: any) => e.status === 'SCHEDULED' || e.status === 'PROCESSING' || e.status === 'RESCHEDULED').length);
      setSentCount(sentList.filter((e: any) => e.status === 'SENT').length);
      setFailedCount(sentList.filter((e: any) => e.status === 'FAILED').length);
    } catch {
      // Quiet fallback if unauthenticated or erroring
    }
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSlackConnect = async () => {
    try {
      const res = await api.post('/slack/connect');
      if (res.data.url) {
        window.open(res.data.url, '_blank', 'width=600,height=700');
      }
    } catch {
      alert('Failed to initialize Slack OAuth.');
    }
  };

  const handleSlackDisconnect = async () => {
    try {
      await api.post('/slack/disconnect');
      await refreshSlackStatus();
    } catch {
      alert('Failed to disconnect Slack.');
    }
  };

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'OB';

  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-white border-r border-slate-200/90 z-30 flex flex-col justify-between p-4 transition-colors duration-150 ease-in-out">
      <div className="flex flex-col gap-3">
        {/* Logo / Brand Header */}
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="w-7 h-7 rounded-lg bg-[#0f172a] text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-[#0f172a]/20">
            O
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base font-bold tracking-tight text-[#0f172a] leading-none">Outbox</span>
            <span className="text-[11px] text-slate-500 truncate mt-1 leading-none">
              {user?.email || 'alex@company.com'}
            </span>
          </div>
        </div>

        {/* Quick Compose Action Button */}
        <Link
          to="/compose"
          className="w-full flex items-center justify-center gap-1.5 bg-[#0f172a] hover:bg-[#1e293b] active:bg-[#172554] text-white font-medium text-xs py-2 px-3 rounded-lg transition-colors duration-150 shadow-sm shadow-[#0f172a]/20"
        >
          <span className="material-symbols-outlined text-[18px]">edit_note</span>
          <span>Compose</span>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex flex-col gap-1 mt-1">
          {/* Dashboard */}
          <Link
            to="/dashboard"
            className={`flex items-center justify-between font-medium text-xs rounded-lg px-3 py-2 transition-colors duration-150 ease-in-out ${
              location.pathname === '/dashboard'
                ? 'bg-blue-50/70 text-[#0f172a] border-l-2 border-[#1e3a8a] font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-[#0f172a]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`material-symbols-outlined text-[18px] ${location.pathname === '/dashboard' ? 'text-[#1e3a8a]' : 'text-slate-500'}`}>
                dashboard
              </span>
              <span>Dashboard</span>
            </div>
          </Link>

          {/* Compose */}
          <Link
            to="/compose"
            className={`flex items-center justify-between font-medium text-xs rounded-lg px-3 py-2 transition-colors duration-150 ease-in-out ${
              location.pathname === '/compose'
                ? 'bg-blue-50/70 text-[#0f172a] border-l-2 border-[#1e3a8a] font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-[#0f172a]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`material-symbols-outlined text-[18px] ${location.pathname === '/compose' ? 'text-[#1e3a8a]' : 'text-slate-500'}`}>
                edit_note
              </span>
              <span>Compose</span>
            </div>
          </Link>

          {/* Scheduled Emails Badge Nav */}
          <Link
            to="/dashboard"
            className="flex items-center justify-between text-slate-600 hover:bg-slate-50 hover:text-[#0f172a] font-medium text-xs rounded-lg px-3 py-2 transition-colors duration-150"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-slate-500">schedule_send</span>
              <span>Scheduled Emails</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-50 text-[#1e3a8a] border border-blue-200/80 whitespace-nowrap">
              {scheduledCount}
            </span>
          </Link>

          {/* Sent Emails Badge Nav */}
          <Link
            to="/dashboard"
            className="flex items-center justify-between text-slate-600 hover:bg-slate-50 hover:text-[#0f172a] font-medium text-xs rounded-lg px-3 py-2 transition-colors duration-150"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-slate-500">mark_email_read</span>
              <span>Sent Emails</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-50 text-[#1e3a8a] border border-blue-200/80 whitespace-nowrap">
              {sentCount}
            </span>
          </Link>

          {/* Failed Emails Badge Nav */}
          <Link
            to="/dashboard"
            className="flex items-center justify-between text-slate-600 hover:bg-slate-50 hover:text-[#0f172a] font-medium text-xs rounded-lg px-3 py-2 transition-colors duration-150"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-slate-500">error_outline</span>
              <span>Failed Emails</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-50 text-[#1e3a8a] border border-blue-200/80 whitespace-nowrap">
              {failedCount}
            </span>
          </Link>

          {/* Active Senders */}
          <div className="flex items-center justify-between text-slate-600 font-medium text-xs rounded-lg px-3 py-2">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-slate-500">alternate_email</span>
              <span>Active Senders</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-50 text-[#1e3a8a] border border-blue-200/80 whitespace-nowrap">
              1
            </span>
          </div>

          {/* Slack Integration Button */}
          <button
            type="button"
            onClick={slackStatus.connected ? handleSlackDisconnect : handleSlackConnect}
            className={`w-full flex items-center justify-between text-xs font-medium rounded-lg px-3 py-2 transition-colors duration-150 ${
              slackStatus.connected
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-[#0f172a]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-slate-500">hub</span>
              <span>Slack Integration</span>
            </div>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                slackStatus.connected
                  ? 'bg-emerald-200 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {slackStatus.connected ? 'Connected' : 'Connect'}
            </span>
          </button>

          {/* Bull Board External Link */}
          <a
            href={BULL_BOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-slate-600 hover:bg-slate-50 hover:text-[#0f172a] font-medium text-xs rounded-lg px-3 py-2 transition-colors duration-150"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-slate-500">monitoring</span>
              <span>Bull Board</span>
            </div>
            <span className="material-symbols-outlined text-[14px] text-slate-400">open_in_new</span>
          </a>
        </nav>
      </div>

      {/* Footer User & Logout */}
      <div className="pt-3 border-t border-slate-200">
        <div className="flex items-center gap-2.5 px-1 py-1 mb-1">
          <div className="w-7 h-7 rounded-full bg-blue-50 text-[#1e3a8a] flex items-center justify-center font-semibold text-xs ring-1 ring-blue-200/90">
            {userInitials}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-[#0f172a] truncate">{user?.name || 'User'}</span>
            <span className="text-[11px] text-slate-500 truncate">{user?.email}</span>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full flex items-center gap-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-[#0f172a] rounded-lg px-3 py-2 transition-colors duration-150"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
