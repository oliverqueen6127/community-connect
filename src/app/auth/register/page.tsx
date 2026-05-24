'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const { addToast } = useApp();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      addToast({ type: 'error', message: 'Please fill in all fields' });
      return;
    }
    if (password !== confirmPassword) {
      addToast({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    if (password.length < 6) {
      addToast({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    addToast({ type: 'success', message: 'Account created! Welcome to Community Connect AI!' });
    setIsLoading(false);
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8" style={{ animation: 'slideUp 0.4s ease' }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)', boxShadow: '0 0 25px rgba(0,227,140,0.4)' }}>
            <svg className="w-8 h-8 text-[#050816]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white">Join Community Connect</h1>
          <p className="text-white/40 mt-2">Create your free account today</p>
        </div>

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
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                  required
                  minLength={field.label === 'Password' ? 6 : undefined}
                />
              </div>
            ))}

            <p className="text-xs text-white/20">
              By signing up, you agree to our{' '}
              <Link href="#" className="text-[#00E38C] hover:underline">Terms of Service</Link> and{' '}
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
