'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';

function LoginForm() {
  const { login, addToast, user } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || null;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (user) {
      router.push(redirect || (user.role === 'admin' ? '/admin' : '/profile'));
    }
  }, [user, redirect, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await login(username.trim(), password.trim());
      addToast({ type: 'success', message: 'Connexion réussie ! Bienvenue.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (type: 'admin' | 'user') => {
    setUsername(type);
    setPassword(type);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8" style={{ animation: 'slideUp 0.4s ease' }}>
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)', boxShadow: '0 0 25px rgba(0,227,140,0.4)' }}>
              <svg className="w-6 h-6 text-[#050816]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </Link>
          <h1 className="text-3xl font-black text-white">Bienvenue</h1>
          <p className="text-white/40 mt-1 text-sm">Connectez-vous à Community Connect AI</p>
        </div>

        {/* Demo Accounts */}
        <div className="glass border border-[#00E38C]/20 rounded-2xl p-4 mb-5" style={{ animation: 'slideUp 0.45s ease' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-[#00E38C] flex items-center justify-center text-[#050816] text-[10px] font-bold">ℹ</span>
            <span className="text-sm font-bold text-[#00E38C]">Comptes de démonstration</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="flex flex-col items-start p-3 glass border border-white/10 hover:border-[#00E38C]/40 rounded-xl transition-all text-left group"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[#050816] text-[10px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>A</span>
                <span className="text-xs font-bold text-[#00E38C]">Admin</span>
              </div>
              <code className="text-[11px] text-white/30 font-mono">admin / admin</code>
              <span className="mt-1 text-[10px] text-white/40 group-hover:text-[#00E38C] transition-colors">Cliquer →</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('user')}
              className="flex flex-col items-start p-3 glass border border-white/10 hover:border-[#00C2FF]/40 rounded-xl transition-all text-left group"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-5 h-5 rounded-full bg-[#00C2FF] flex items-center justify-center text-[#050816] text-[10px] font-bold">U</span>
                <span className="text-xs font-bold text-[#00C2FF]">User</span>
              </div>
              <code className="text-[11px] text-white/30 font-mono">user / user</code>
              <span className="mt-1 text-[10px] text-white/40 group-hover:text-[#00C2FF] transition-colors">Cliquer →</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="glass border border-white/10 rounded-3xl p-7" style={{ animation: 'slideUp 0.5s ease' }}>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">
                Identifiant
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="admin  ou  user"
                autoComplete="username"
                className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
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

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm" style={{ animation: 'slideDown 0.2s ease' }}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

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
                  Connexion en cours...
                </>
              ) : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-white/30 mt-5">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-[#00E38C] font-bold hover:text-[#00C2FF] transition-colors">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
