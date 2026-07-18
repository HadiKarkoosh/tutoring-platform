'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { api } from '../../lib/api';
import { useT } from '../../lib/i18n';

const TEXT = {
  invalidLink: {
    ar: 'رابط إعادة التعيين ناقص أو غير صالح.',
    en: 'The reset link is missing or invalid.',
  },
  requestNew: { ar: 'اطلب رابط جديد', en: 'Request a new link' },
  title: { ar: 'تعيين كلمة مرور جديدة', en: 'Set a new password' },
  success: {
    ar: 'تم تغيير كلمة المرور! جارٍ تحويلك لتسجيل الدخول…',
    en: 'Password changed! Redirecting you to log in…',
  },
  newPassword: { ar: 'كلمة المرور الجديدة (6 أحرف على الأقل)', en: 'New password (6+ characters)' },
  confirmPassword: { ar: 'تأكيد كلمة المرور', en: 'Confirm password' },
  saving: { ar: 'جارٍ الحفظ…', en: 'Saving…' },
  submit: { ar: 'تغيير كلمة المرور', en: 'Change password' },
  loading: { ar: 'جارٍ التحميل…', en: 'Loading…' },
  passwordMismatch: { ar: 'كلمتا المرور غير متطابقتين', en: 'Passwords do not match' },
  changeFailed: { ar: 'تعذّر تغيير كلمة المرور', en: 'Could not change the password' },
};

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const t = useT(TEXT);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== passwordConfirm) {
      setError(t.passwordMismatch);
      return;
    }
    setBusy(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setError(err.message ?? t.changeFailed);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="card form-card">
        <div className="alert alert-error">
          {t.invalidLink}{' '}
          <Link href="/forgot-password" style={{ color: 'var(--primary)' }}>
            {t.requestNew}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card form-card">
      <h1 className="page-title">{t.title}</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {done && <div className="alert alert-success">{t.success}</div>}
      {!done && (
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>{t.newPassword}</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
            />
          </div>
          <div className="field">
            <label>{t.confirmPassword}</label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              dir="ltr"
            />
          </div>
          <button className="btn" style={{ width: '100%' }} disabled={busy}>
            {busy ? t.saving : t.submit}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="muted">{'جارٍ التحميل… / Loading…'}</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
