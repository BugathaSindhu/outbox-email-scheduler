import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, slackStatus, refreshSlackStatus } = useAuth();

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

  const navItems = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { label: 'Compose', icon: 'edit_note', path: '/compose' },
  ];

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'OB';

  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-white border-r border-[#c3c6d7] z-30 flex flex-col justify-between p-4 transition-colors duration-150 ease-in-out">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-1 py-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#2563eb] text-white flex items-center justify-center font-bold tracking-tight shadow-sm">
            <span className="material-symbols-outlined text-[20px]">send</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-lg font-bold tracking-tight text-[#0b1c30] leading-none">Outbox</span>
            <span className="text-[11px] font-medium text-[#434655] truncate mt-0.5 max-w-[130px]">
              {user?.email || 'admin@outbox.io'}
            </span>
          </div>
        </div>

        {/* Quick Compose CTA */}
        <Link
          to="/compose"
          className="w-full flex items-center justify-center gap-2 bg-[#2563eb] text-white font-medium text-[13px] py-2 px-3 rounded-lg hover:bg-[#004ac6] transition-colors duration-150 mb-6 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Compose</span>
        </Link>

        {/* Navigation Tabs */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 text-[13px] font-medium rounded-lg px-3 py-2 transition-colors duration-150 ease-in-out ${
                  isActive
                    ? 'bg-[#e5eeff] text-[#004ac6] border-l-2 border-[#004ac6]'
                    : 'text-[#434655] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Slack Connection Item */}
          <button
            type="button"
            onClick={slackStatus.connected ? handleSlackDisconnect : handleSlackConnect}
            className={`w-full flex items-center justify-between text-[13px] font-medium rounded-lg px-3 py-2 transition-colors duration-150 ease-in-out ${
              slackStatus.connected
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'text-[#434655] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]">hub</span>
              <span>Slack</span>
            </div>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                slackStatus.connected
                  ? 'bg-emerald-200 text-emerald-800'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {slackStatus.connected ? 'Connected' : 'Connect'}
            </span>
          </button>

          {/* Bull Board External Monitor Item */}
          <a
            href="http://localhost:5000/admin/queues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-[13px] font-medium text-[#434655] hover:bg-[#eff4ff] hover:text-[#0b1c30] rounded-lg px-3 py-2 transition-colors duration-150 ease-in-out"
          >
            <span className="material-symbols-outlined text-[18px]">monitoring</span>
            <span>Bull Board</span>
            <span className="material-symbols-outlined text-[14px] ml-auto text-gray-400">open_in_new</span>
          </a>
        </nav>
      </div>

      {/* Footer User Profile & Logout */}
      <div className="pt-3 border-t border-[#c3c6d7]">
        <div className="flex items-center gap-3 px-1 py-1.5 mb-1">
          <div className="w-8 h-8 rounded-full bg-[#d3e4fe] flex items-center justify-center text-[#004ac6] font-semibold text-xs border border-[#c3c6d7]">
            {userInitials}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[13px] font-semibold text-[#0b1c30] truncate">{user?.name || 'User'}</span>
            <span className="text-[11px] text-[#434655] truncate">{user?.email}</span>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full flex items-center gap-3 text-[13px] font-medium text-[#434655] rounded-lg px-3 py-2 hover:bg-red-50 hover:text-[#ba1a1a] transition-colors duration-150 ease-in-out"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
