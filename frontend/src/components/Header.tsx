import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, PlusCircle, LogOut, ExternalLink, Slack, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

export const Header: React.FC = () => {
  const { user, logout, slackStatus, refreshSlackStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSlackConnect = async () => {
    try {
      const res = await api.post('/slack/connect');
      if (res.data.url) {
        window.open(res.data.url, '_blank', 'width=600,height=700');
      }
    } catch {
      alert('Failed to initialize Slack OAuth. Check client credentials in backend.');
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

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="bg-brand-600 p-2 rounded-xl text-white shadow-sm">
                <Mail className="w-6 h-6" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">
                Outbox <span className="text-brand-600">Labs</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links & Action Controls */}
          <div className="flex items-center space-x-4">
            {/* Bull Board link */}
            <a
              href={`${import.meta.env.VITE_API_URL}/admin/queues`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center text-xs font-semibold text-gray-600 hover:text-brand-600 bg-gray-100 hover:bg-brand-50 px-3 py-1.5 rounded-lg border border-gray-200 transition"
              title="Open Bull Board Queue Monitor"
            >
              Bull Board <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>

            {/* Slack Connection status */}
            {slackStatus.connected ? (
              <button
                onClick={handleSlackDisconnect}
                className="flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition"
                title="Slack Connected - Click to Disconnect"
              >
                <Slack className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Slack Connected <CheckCircle className="w-3 h-3 ml-1 text-emerald-600" />
              </button>
            ) : (
              <button
                onClick={handleSlackConnect}
                className="flex items-center text-xs font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition"
                title="Connect Slack for rate limit notifications"
              >
                <Slack className="w-3.5 h-3.5 mr-1" />
                Connect Slack
              </button>
            )}

            {/* Compose Campaign Button */}
            {location.pathname !== '/compose' && (
              <Link
                to="/compose"
                className="inline-flex items-center bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Schedule Email
              </Link>
            )}

            {/* User Profile / Avatar */}
            {user && (
              <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
                <img
                  src={user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=OutboxUser'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-gray-300"
                />
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-gray-900 leading-none">{user.name}</p>
                  <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
