import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const TopHeader: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'OB';

  return (
    <header className="fixed top-0 left-60 right-0 h-12 bg-white border-b border-[#c3c6d7] z-20 flex items-center justify-between px-6 transition-colors duration-150 ease-in-out">
      <div className="flex items-center gap-3">
        <span className="font-semibold text-[15px] text-[#0b1c30] tracking-tight">Outbox</span>
        <span className="text-[#c3c6d7] text-xs">•</span>
        <span className="text-xs font-medium text-[#434655]">
          {location.pathname === '/compose' ? 'Compose New Email' : 'Dashboard'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {location.pathname !== '/compose' && (
          <Link
            to="/compose"
            className="bg-[#2563eb] hover:bg-[#004ac6] text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-colors duration-150 shadow-sm flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">edit_note</span>
            <span>Compose</span>
          </Link>
        )}

        {/* User avatar thumbnail */}
        <div
          className="w-7 h-7 rounded-full bg-[#dbe1ff] text-[#00174b] flex items-center justify-center text-[11px] font-bold border border-[#c3c6d7]"
          title={user?.email}
        >
          {userInitials}
        </div>
      </div>
    </header>
  );
};
