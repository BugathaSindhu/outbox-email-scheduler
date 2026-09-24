import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopHeader } from '../components/TopHeader';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans antialiased">
      <Sidebar />
      <TopHeader />
      <main className="ml-60 pt-12 min-h-screen bg-slate-50/70">
        <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col gap-6">{children}</div>
      </main>
    </div>
  );
};
