import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GOOGLE_OAUTH_URL } from '../services/api';

export const Signup: React.FC = () => {
  const { user, signup, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth().then((authenticated) => {
      if (authenticated || user) {
        navigate('/dashboard');
      }
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to create account. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_OAUTH_URL;
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 lg:p-12 antialiased bg-[#0b1329] selection:bg-blue-600 selection:text-white">
      <main className="w-full max-w-5xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border backdrop-blur-xl border-slate-800">
        {/* Left Column: Outbox Brand Showcase */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 relative overflow-hidden bg-slate-900 text-white">
          {/* Ambient glows */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 ring-1 ring-white/20">
                <svg className="w-6 h-6 text-white fill-current transform rotate-[-12deg] translate-x-0.5" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight text-white">Outbox</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium font-sans">Email Job Scheduler</p>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight mb-3">
              Start dispatching with high deliverability.
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Create your account to schedule campaigns with automated BullMQ rate limiting, Slack notifications, and real-time tracking.
            </p>
          </div>

          {/* Value propositions */}
          <div className="my-8 space-y-4 relative z-10">
            <div className="flex items-start gap-3.5 group p-2.5 rounded-xl transition-colors hover:bg-white/5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Automated Queue Management</h4>
                <p className="text-xs text-slate-400 leading-relaxed">BullMQ queues with Redis state durability and automatic retry handling.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 group p-2.5 rounded-xl transition-colors hover:bg-white/5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Elasticsearch Telemetry</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Sub-second full text recipient &amp; subject log search across historical dispatches.</p>
              </div>
            </div>
          </div>

          {/* Footer status */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 relative z-10">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Operational · 99.98% SLA
            </span>
            <span>SOC2 Type II Compliant</span>
          </div>
        </div>

        {/* Right Column: Registration Form Card */}
        <div className="lg:col-span-6 bg-white p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {/* Form Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create Account</h2>
              <p className="text-sm text-slate-500 mt-1">Get started with your Outbox email scheduler account.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full rounded-lg bg-slate-50 hover:bg-white border border-slate-200 focus:bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full rounded-lg bg-slate-50 hover:bg-white border border-slate-200 focus:bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full rounded-lg bg-slate-50 hover:bg-white border border-slate-200 focus:bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                  className="w-full rounded-lg bg-slate-50 hover:bg-white border border-slate-200 focus:bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 active:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all duration-150 disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>

              <div className="relative my-4">
                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-white px-3 font-medium text-slate-400">or continue with</span>
                </div>
              </div>

              {/* Google OAuth Option */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/40 transition-all duration-150"
              >
                <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google OAuth</span>
              </button>
            </form>
          </div>

          {/* Bottom Redirect */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-slate-900 hover:text-blue-600 transition-colors ml-0.5">
                Sign In
              </Link>
            </p>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="hover:text-slate-600 cursor-pointer">Terms</span>
              <span>•</span>
              <span className="hover:text-slate-600 cursor-pointer">Privacy</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
