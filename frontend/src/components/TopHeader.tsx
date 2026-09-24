import React from 'react';
import { useAuth } from '../context/AuthContext';

export const TopHeader: React.FC = () => {
  const { user } = useAuth();

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
    <header className="fixed top-0 left-60 right-0 h-12 bg-white border-b border-slate-200/90 z-20">
      <div className="flex items-center justify-between h-12 px-6">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-[#0f172a] tracking-tight">Outbox</span>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="w-7 h-7 rounded-full bg-blue-50 text-[#1e3a8a] flex items-center justify-center font-semibold text-xs ring-1 ring-blue-200/90"
            title={user?.email}
          >
            {userInitials}
          </div>
        </div>
      </div>
    </header>
  );
};
