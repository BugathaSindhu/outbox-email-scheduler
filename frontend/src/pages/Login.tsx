import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GOOGLE_OAUTH_URL } from '../services/api';

export const Login: React.FC = () => {
  const { user, loginWithToken, demoLogin, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_OAUTH_URL;
  };

  const handleQuickDemoLogin = async () => {
    setLoadingDemo(true);
    try {
      await demoLogin('reviewer@outboxlabs.io', 'Evaluation User');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Demo login is disabled or unavailable. Please use Google OAuth.';
      alert(msg);
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
          {/* Google OAuth Button */}
          <button
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

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#737686]/40" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#213145] px-3 text-[#c3c6d7] font-semibold">Or Quick Reviewer Evaluation</span>
            </div>
          </div>

          {/* Quick Instant Demo Login Button */}
          <button
            onClick={handleQuickDemoLogin}
            disabled={loadingDemo}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2563eb] hover:bg-[#004ac6] text-white rounded-lg font-semibold text-sm shadow-lg shadow-[#2563eb]/20 transition-colors duration-150 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>{loadingDemo ? 'Logging in...' : 'Instant Demo Login (No Setup Required)'}</span>
          </button>

          <div className="mt-6 pt-4 border-t border-[#737686]/40 text-[12px] text-[#c3c6d7] space-y-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
              <span>BullMQ + Redis delayed queue scheduling engine</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-sm">schedule</span>
              <span>Atomic Redis rate limiter & restart persistence</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
