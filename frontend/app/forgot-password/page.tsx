'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { api } from '../../lib/api';
import { useT } from '../../lib/i18n';

const TEXT = {
  title: { ar: 'نسيت كلمة المرور؟', en: 'Forgot your password?' },
  subtitle: { ar: 'بنبعتلك رابط لإعادة تعيينها', en: "We'll send you a reset link" },
  demoNote: {
    ar: '🚧 بيئة تجريبية بدون خدمة بريد فعلية — بالنشر الحقيقي كان هالرابط رح يوصلك بالإيميل بدل ما يظهر هون:',
    en: "🚧 Demo environment with no real email service — in a real deployment this link would arrive by email instead of showing here:",
  },
  continueReset: { ar: 'متابعة لإعادة تعيين كلمة المرور', en: 'Continue to reset password' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  sending: { ar: 'جارٍ الإرسال…', en: 'Sending…' },
  sendLink: { ar: 'إرسال رابط إعادة التعيين', en: 'Send reset link' },
  rememberPassword: { ar: 'تذكّرت كلمة المرور؟', en: 'Remembered your password?' },
  loginNow: { ar: 'سجّل دخولك', en: 'Log in' },
  requestFailed: { ar: 'تعذّر إرسال الطلب', en: 'Could not send the request' },
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const t = useT(TEXT);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api<{ message: string; resetUrl?: string }>(
        '/auth/forgot-password',
        { method: 'POST', body: JSON.stringify({ email }) },
      );
      setMessage(res.message);
      setResetUrl(res.resetUrl ?? '');
    } catch (err: any) {
      setError(err.message ?? t.requestFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card form-card">
      <h1 className="page-title">{t.title}</h1>
      <p className="page-subtitle">{t.subtitle}</p>
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {resetUrl ? (
        <div className="alert" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <p className="muted" style={{ marginBottom: 10 }}>
            {t.demoNote}
          </p>
          <Link href={resetUrl.replace(/^https?:\/\/[^/]+/, '')} className="btn btn-sm" style={{ wordBreak: 'break-all' }}>
            {t.continueReset}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>{t.email}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
          </div>
          <button className="btn" style={{ width: '100%' }} disabled={busy}>
            {busy ? t.sending : t.sendLink}
          </button>
        </form>
      )}

      <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
        {t.rememberPassword} <Link href="/login" style={{ color: 'var(--primary)' }}>{t.loginNow}</Link>
      </p>
    </div>
  );
}
