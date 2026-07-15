'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { api } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');

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
      setError(err.message ?? 'تعذّر إرسال الطلب');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card form-card">
      <h1 className="page-title">نسيت كلمة المرور؟</h1>
      <p className="page-subtitle">بنبعتلك رابط لإعادة تعيينها</p>
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {resetUrl ? (
        <div className="alert" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <p className="muted" style={{ marginBottom: 10 }}>
            🚧 بيئة تجريبية بدون خدمة بريد فعلية — بالنشر الحقيقي كان هالرابط رح يوصلك بالإيميل بدل ما يظهر هون:
          </p>
          <Link href={resetUrl.replace(/^https?:\/\/[^/]+/, '')} className="btn btn-sm" style={{ wordBreak: 'break-all' }}>
            متابعة لإعادة تعيين كلمة المرور
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
          </div>
          <button className="btn" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'جارٍ الإرسال…' : 'إرسال رابط إعادة التعيين'}
          </button>
        </form>
      )}

      <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
        تذكّرت كلمة المرور؟ <Link href="/login" style={{ color: 'var(--primary)' }}>سجّل دخولك</Link>
      </p>
    </div>
  );
}
