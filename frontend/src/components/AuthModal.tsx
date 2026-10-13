import React, { useState } from 'react';
import { X, LogIn, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, loginWithGoogle, loginWithEmail, loginAsDemo } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [showGoogleInput, setShowGoogleInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  const handleGoogleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const selectedEmail = googleEmail.trim() || 'sarah.connor@gmail.com';
      const userName = selectedEmail.split('@')[0].replace('.', ' ');
      await loginWithGoogle(selectedEmail, userName);
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      setLoading(true);
      setError('');
      await loginWithEmail(email, password, name, isRegister);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm modal-backdrop">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden modal-content">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] flex items-center justify-center">
              <LogIn className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--fg)] text-sm">
                {isRegister ? 'Create Account' : 'Sign In'}
              </h3>
              <p className="text-xs text-[var(--fg-muted)]">Welcome to your personal budget</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500">
              {error}
            </div>
          )}

          {/* Google OAuth Option */}
          <div className="space-y-2">
            {!showGoogleInput ? (
              <button
                type="button"
                onClick={() => handleGoogleSubmit()}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--fg)] text-xs font-medium transition shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </button>
            ) : (
              <form onSubmit={handleGoogleSubmit} className="space-y-2">
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="Enter your Gmail (e.g. alex@gmail.com)"
                  autoFocus
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg px-3 py-2 text-xs text-[var(--fg)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-[var(--fg)] text-[var(--bg)] rounded-lg text-xs font-semibold hover:opacity-90 transition"
                >
                  Sign in with this Gmail
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => setShowGoogleInput(!showGoogleInput)}
              className="w-full text-center text-[10px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition"
            >
              {showGoogleInput ? 'Use default 1-click Google test account' : 'Sign in with a specific Gmail address'}
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[var(--border)] w-full"></div>
            <span className="bg-[var(--surface)] px-3 text-[10px] text-[var(--fg-muted)] uppercase tracking-wider absolute">
              or with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {isRegister && (
              <div>
                <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] transition flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Signing in...' : isRegister ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition text-[11px]"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>

            <button
              type="button"
              onClick={() => loginAsDemo()}
              className="text-[11px] font-medium text-emerald-500 hover:text-emerald-600 transition"
            >
              Explore Demo Mode →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
