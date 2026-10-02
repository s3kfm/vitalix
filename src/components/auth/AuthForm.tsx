'use client';

import Link from 'next/link';
import { authClient } from '@/src/lib/auth/client';
import { useState, type FormEvent } from 'react';

export function AuthForm({ signup = false }: { signup?: boolean }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const email = String(form.get('email') ?? '')
        .trim()
        .toLowerCase();
      const password = String(form.get('password') ?? '');
      const result = signup
        ? await authClient.signUp.email({ email, password, name: email })
        : await authClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message || 'Please try again.');
      window.location.assign('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Please try again.');
      setBusy(false);
    }
  }
  return (
    <main style={{ maxWidth: 420, margin: '10vh auto', padding: 24 }}>
      <Link href="/" className="brand">
        Vitalix
      </Link>
      <h1>{signup ? 'Create your account' : 'Welcome back'}</h1>
      <p>
        {signup
          ? 'Keep your health records together in your private workspace.'
          : 'Log in to your health records.'}
      </p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          disabled={busy}
          style={{ padding: 12 }}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={signup ? 'new-password' : 'current-password'}
          minLength={12}
          maxLength={128}
          required
          disabled={busy}
          aria-describedby={signup ? 'password-help' : undefined}
          style={{ padding: 12 }}
        />
        {signup && <small id="password-help">Use 12–128 characters.</small>}
        {error && <p role="alert">{error}</p>}
        <button className="button" disabled={busy} type="submit">
          {busy ? 'Please wait…' : signup ? 'Sign up' : 'Log in'}
        </button>
      </form>
      <p style={{ marginTop: 24 }}>
        {signup ? 'Already have an account? ' : 'New to Vitalix? '}
        <Link href={signup ? '/login' : '/signup'}>{signup ? 'Log in' : 'Sign up'}</Link>
      </p>
    </main>
  );
}
