'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm" style={{ animation: 'slideDown 0.2s ease' }}>
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      {message}
    </div>
  );
}

// ── Email-sent screen ─────────────────────────────────────────────────────────
function VerificationSent({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center" style={{ animation: 'slideUp 0.4s ease' }}>
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg, rgba(0,227,140,0.2), rgba(0,194,255,0.2))', border: '1px solid rgba(0,227,140,0.3)', boxShadow: '0 0 30px rgba(0,227,140,0.2)' }}
        >
          <svg className="w-10 h-10 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-white mb-3">Check your email</h2>
        <p className="text-white/50 mb-2">We sent a verification link to:</p>
        <p className="text-[#00E38C] font-bold text-lg mb-6">{email}</p>
        <p className="text-white/30 text-sm mb-8">
          Click the link in the email to activate your account, then sign in below.
        </p>
        <button
          onClick={onBack}
          className="inline-block px-8 py-3.5 rounded-2xl font-bold text-[#050816] transition-all hover:shadow-[0_0_25px_rgba(0,227,140,0.4)]"
          style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}

// ── Main auth form ────────────────────────────────────────────────────────────
function AuthForm() {
  const { login, addToast, user } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const redirect = searchParams.get('redirect') || null;

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  // Redirect when already logged in
  React.useEffect(() => {
    if (user) router.push(redirect || (user.role === 'admin' ? '/admin' : '/profile'));
  }, [user, redirect, router]);

  const switchMode = (next: 'login' | 'signup') => {
    setMode(next);
    setError('');
    setShowPassword(false);
  };

  // ── Login handler ────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = loginEmail.trim();
    const password = loginPassword.trim();

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      addToast({ type: 'success', message: 'Welcome back!' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Sign-up handler ──────────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = signupName.trim();
    const email = signupEmail.trim();
    const password = signupPassword;
    const confirm = signupConfirm;

    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!supabase) {
      setError('Supabase client could not be initialised. Check your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server.');
      return;
    }

    setError('');
    setIsLoading(true);
    console.log('signup submit fired', { name, email });

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });

      console.log('supabase signup response', data, signUpError);
      if (signUpError) throw new Error(signUpError.message);

      if (data.session) {
        // Email confirmation disabled — user is immediately active
        addToast({ type: 'success', message: `Welcome to Community Connect, ${name}!` });
        router.push(redirect || '/');
      } else {
        // Email confirmation required
        setVerificationSent(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <VerificationSent
        email={signupEmail}
        onBack={() => { setVerificationSent(false); switchMode('login'); }}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-7" style={{ animation: 'slideUp 0.4s ease' }}>
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)', boxShadow: '0 0 25px rgba(0,227,140,0.4)' }}
            >
              <svg className="w-6 h-6 text-[#050816]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </Link>
          <h1 className="text-3xl font-black text-white">Community Connect</h1>
          <p className="text-white/40 mt-1 text-sm">
            {mode === 'login' ? 'Sign in to your account' : 'Create your free account'}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="glass border border-white/10 rounded-2xl p-1.5 flex mb-5" style={{ animation: 'slideUp 0.45s ease' }}>
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${mode === m ? 'text-[#050816]' : 'text-white/40 hover:text-white'}`}
              style={mode === m ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' } : {}}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Sign-up dev warning — only shown when env vars are genuinely absent */}
        {mode === 'signup' && !isSupabaseEnabled && (
          <div className="glass border border-yellow-500/20 rounded-2xl p-3.5 mb-4 text-sm text-yellow-400/80" style={{ animation: 'slideDown 0.2s ease' }}>
            <strong>Supabase not detected.</strong> Check that <code className="text-yellow-300">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-yellow-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are set in <code className="text-yellow-300">.env.local</code> and that the dev server was restarted. For dev testing use <code className="text-yellow-300">admin/admin</code> on the Sign In tab.
          </div>
        )}

        {/* Form card */}
        <div className="glass border border-white/10 rounded-3xl p-7" style={{ animation: 'slideUp 0.5s ease' }}>

          {/* ── LOGIN FORM ────────────────────────────────────────────────── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Email</label>
                <input
                  type="text"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setError(''); }}
                  placeholder="your@email.com or username"
                  autoComplete="email"
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => { setLoginPassword(e.target.value); setError(''); }}
                    placeholder="••••••"
                    autoComplete="current-password"
                    className="glass-input w-full px-4 py-3 pr-12 rounded-xl text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <ErrorBanner message={error} />}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 text-[#050816] font-bold rounded-2xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base hover:shadow-[0_0_25px_rgba(0,227,140,0.4)]"
                style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
              >
                {isLoading ? <><Spinner /> Signing in...</> : 'Sign In'}
              </button>

              <p className="text-center text-sm text-white/30">
                No account yet?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="text-[#00E38C] font-bold hover:text-[#00C2FF] transition-colors">
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* ── SIGN UP FORM ──────────────────────────────────────────────── */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Full Name</label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => { setSignupName(e.target.value); setError(''); }}
                  placeholder="Your full name"
                  autoComplete="name"
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Email Address</label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => { setSignupEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => { setSignupPassword(e.target.value); setError(''); }}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    className="glass-input w-full px-4 py-3 pr-12 rounded-xl text-sm"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={signupConfirm}
                  onChange={(e) => { setSignupConfirm(e.target.value); setError(''); }}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                  required
                  minLength={6}
                />
              </div>

              {error && <ErrorBanner message={error} />}

              <p className="text-xs text-white/20 pt-1">
                By signing up you agree to our{' '}
                <Link href="#" className="text-[#00E38C] hover:underline">Terms</Link> and{' '}
                <Link href="#" className="text-[#00E38C] hover:underline">Privacy Policy</Link>.
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 text-[#050816] font-bold rounded-2xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base hover:shadow-[0_0_25px_rgba(0,227,140,0.4)]"
                style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
              >
                {isLoading ? <><Spinner /> Creating account...</> : 'Create Account'}
              </button>

              <p className="text-center text-sm text-white/30">
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')} className="text-[#00E38C] font-bold hover:text-[#00C2FF] transition-colors">
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
