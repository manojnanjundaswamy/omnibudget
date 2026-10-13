import React, { useState } from 'react';
import {
  X,
  LogIn,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginWithGoogle,
    loginWithEmail,
    sendLoginOtp,
    verifyLoginOtp,
    loginAsDemo,
  } = useAuth();

  const [authMode, setAuthMode] = useState<'OTP' | 'PASSWORD' | 'GOOGLE'>('OTP');
  const [isRegister, setIsRegister] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [showGoogleInput, setShowGoogleInput] = useState(false);

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      setLoading(true);
      setError('');
      const res = await sendLoginOtp(email, name);
      setOtpSent(true);
      setOtpSuccessMsg(res.message || `Verification code sent to ${email}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send login code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await verifyLoginOtp(email, otpCode);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
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
                OmniBudget Sign In
              </h3>
              <p className="text-xs text-[var(--fg-muted)]">Secure multi-factor authentication</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[var(--border)] bg-[var(--surface)] p-1.5 gap-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setAuthMode('OTP');
              setError('');
            }}
            className={`flex-1 py-1.5 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
              authMode === 'OTP'
                ? 'bg-[var(--surface-2)] text-[var(--fg)] shadow-xs font-semibold'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Code</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('PASSWORD');
              setError('');
            }}
            className={`flex-1 py-1.5 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
              authMode === 'PASSWORD'
                ? 'bg-[var(--surface-2)] text-[var(--fg)] shadow-xs font-semibold'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Password</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('GOOGLE');
              setError('');
            }}
            className={`flex-1 py-1.5 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
              authMode === 'GOOGLE'
                ? 'bg-[var(--surface-2)] text-[var(--fg)] shadow-xs font-semibold'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
            <span>Google</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 flex items-center gap-2">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          {/* TAB 1: EMAIL OTP (MAGIC CODE) */}
          {authMode === 'OTP' && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoFocus
                      className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--fg)] focus:outline-none transition shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1">
                      Your Name <span className="text-[10px] text-[var(--fg-muted)] opacity-70">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--fg)] focus:outline-none transition shadow-2xs"
                    />
                  </div>

                  <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">
                    We will send a secure 6-digit login code to your email. No password needed.
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    {loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Send 6-Digit Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Code Sent to {email}</span>
                    </div>
                    <p className="text-[11px] text-emerald-300/80">
                      Check your email inbox or Mailpit Web UI (http://localhost:8025) for the 6-digit code.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1 text-center">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      autoFocus
                      required
                      className="w-full text-center tracking-[10px] text-lg font-bold bg-[var(--surface-2)] border border-[var(--border)] focus:border-emerald-500 rounded-xl py-2.5 text-[var(--fg)] focus:outline-none transition font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    {loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Verify & Sign In</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-[var(--fg-muted)] pt-2">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="hover:text-[var(--fg)] underline"
                    >
                      ← Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="hover:text-[var(--fg)] underline"
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: PASSWORD AUTH */}
          {authMode === 'PASSWORD' && (
            <form onSubmit={handleEmailPasswordSubmit} className="space-y-3">
              {isRegister && (
                <div>
                  <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
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

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition"
                >
                  {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: GOOGLE OAUTH */}
          {authMode === 'GOOGLE' && (
            <div className="space-y-3">
              {!showGoogleInput ? (
                <div className="space-y-3">
                  <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
                    Authenticate using your Google Workspace or standard Gmail account with one click.
                  </p>

                  <button
                    type="button"
                    onClick={() => handleGoogleSubmit()}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--fg)] text-xs font-semibold transition shadow-sm"
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

                  <button
                    type="button"
                    onClick={() => setShowGoogleInput(true)}
                    className="w-full text-center text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] underline transition"
                  >
                    Sign in with a specific Gmail address
                  </button>
                </div>
              ) : (
                <form onSubmit={handleGoogleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1">
                      Gmail Address
                    </label>
                    <input
                      type="email"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      placeholder="alex.finance@gmail.com"
                      autoFocus
                      required
                      className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--fg)] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-[var(--fg)] text-[var(--bg)] rounded-xl text-xs font-semibold hover:opacity-90 transition"
                  >
                    Authorize Gmail Sign-In
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowGoogleInput(false)}
                    className="w-full text-center text-[10px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition"
                  >
                    ← Back to 1-click Google Sign-in
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Mail Relay Status Banner */}
          <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[10px] text-[var(--fg-muted)] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Mail Relay: Docker Mailpit (:1025 / :8025)</span>
            </div>
            <a
              href="http://localhost:8025"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Mail Inbox</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          {/* Demo Sandbox Link */}
          <div className="pt-2 text-center border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => loginAsDemo()}
              className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition"
            >
              Explore Instant Demo Sandbox →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
