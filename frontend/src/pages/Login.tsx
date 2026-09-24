import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GOOGLE_OAUTH_URL } from '../services/api';

export const Login: React.FC = () => {
  const { user, login, loginWithToken, demoLogin, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      loginWithToken(tokenParam).then(() => navigate('/dashboard'));
    } else {
      checkAuth().then((authenticated) => {
        if (authenticated || user) {
          navigate('/dashboard');
        }
      });
    }
  }, [searchParams, user]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_OAUTH_URL;
  };

  const handleQuickDemoLogin = async () => {
    setLoadingDemo(true);
    setError(null);
    try {
      await demoLogin('reviewer@outboxlabs.io', 'Evaluation User');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Demo login is disabled or unavailable. Please use Google OAuth or Email Login.';
      setError(msg);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1c30] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#2563eb]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#2563eb] text-white shadow-lg mb-4">
          <span className="material-symbols-outlined text-[28px]">send</span>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Outbox</h2>
        <p className="mt-1 text-sm text-[#c3c6d7]">
          High-velocity, rate-limited email scheduling platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#213145]/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-xl border border-[#737686]/40 sm:px-10 space-y-4">
          
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Email / Password Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-[#c3c6d7] tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3 py-2.5 bg-[#0b1c30]/80 border border-[#737686]/40 rounded-lg text-white placeholder-[#737686] text-sm focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[#c3c6d7] tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 bg-[#0b1c30]/80 border border-[#737686]/40 rounded-lg text-white placeholder-[#737686] text-sm focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2563eb] hover:bg-[#004ac6] text-white rounded-lg font-semibold text-sm shadow-lg shadow-[#2563eb]/20 transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#737686]/40" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#213145] px-3 text-[#c3c6d7] font-semibold">Or</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#737686]/50 rounded-lg shadow-sm bg-[#0b1c30]/60 hover:bg-[#0b1c30] text-white font-medium text-sm transition-colors duration-150"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google OAuth</span>
          </button>

          {/* Quick Instant Demo Login Button */}
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loadingDemo}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0b1c30]/40 hover:bg-[#0b1c30]/80 text-[#c3c6d7] hover:text-white border border-[#737686]/30 rounded-lg font-medium text-xs transition-colors duration-150 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-400">bolt</span>
            <span>{loadingDemo ? 'Logging in...' : 'Instant Demo Login (Quick Review)'}</span>
          </button>

          <div className="pt-2 text-center text-xs text-[#c3c6d7]">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#60a5fa] font-semibold hover:underline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
