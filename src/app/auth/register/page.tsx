'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp, isSupabaseEnabled } from '@/lib/context';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const { addToast } = useApp();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      if (!isSupabaseEnabled) {
        // Mock mode — no real registration
        await new Promise((r) => setTimeout(r, 800));
        addToast({ type: 'info', message: 'Demo mode: use admin/admin or user/user to sign in.' });
        router.push('/auth/login');
        return;
      }

      // Import supabase directly for registration
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) throw new Error('Supabase not configured.');

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });

      if (signUpError) throw new Error(signUpError.message);

      const needsVerification = !data.session;

      if (needsVerification) {
        setVerificationSent(true);
      } else {
        addToast({ type: 'success', message: `Welcome to Community Connect, ${name}!` });
        router.push('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationSent) {
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
          <p className="text-[#00E38C] font-bold mb-6">{email}</p>
          <p className="text-white/30 text-sm mb-8">Click the link in the email to activate your account, then sign in.</p>
          <Link
            href="/auth/login"
            className="inline-block px-8 py-3.5 rounded-2xl font-bold text-[#050816] transition-all hover:shadow-[0_0_25px_rgba(0,227,140,0.4)]"
            style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8" style={{ animation: 'slideUp 0.4s ease' }}>
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)', boxShadow: '0 0 25px rgba(0,227,140,0.4)' }}
          >
            <svg className="w-8 h-8 text-[#050816]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white">Join Community Connect</h1>
          <p className="text-white/40 mt-2">
            {isSupabaseEnabled ? 'Create your free account today' : 'Demo mode — real accounts unavailable'}
          </p>
        </div>

        {!isSupabaseEnabled && (
          <div className="glass border border-yellow-500/20 rounded-2xl p-4 mb-5 text-sm text-yellow-400/80">
            <strong>Dev mode:</strong> Supabase is not configured. Sign in with <code className="text-yellow-300">admin/admin</code> or <code className="text-yellow-300">user/user</code>.
          </div>
        )}

        <div className="glass border border-white/10 rounded-3xl p-8" style={{ animation: 'slideUp 0.5s ease' }}>
          <form onSubmit={handleRegister} className="space-y-5">
            {[
              { label: 'Full Name', type: 'text', value: name, set: setName, placeholder: 'Your full name' },
              { label: 'Email Address', type: 'email', value: email, set: setEmail, placeholder: 'you@example.com' },
              { label: 'Password', type: 'password', value: password, set: setPassword, placeholder: 'Min. 6 characters' },
              { label: 'Confirm Password', type: 'password', value: confirmPassword, set: setConfirmPassword, placeholder: 'Repeat your password' },
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-sm font-semibold text-white/60 mb-2">{field.label}</label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => { field.set(e.target.value); setError(''); }}
                  placeholder={field.placeholder}
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                  required
                  minLength={field.label.includes('Password') ? 6 : undefined}
                />
              </div>
            ))}

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            <p className="text-xs text-white/20">
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
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-white/30 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#00E38C] font-bold hover:text-[#00C2FF] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
