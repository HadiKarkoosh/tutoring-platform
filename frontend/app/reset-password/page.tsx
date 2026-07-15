'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { api } from '../../lib/api';

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== passwordConfirm) {
      setError('كلمتا المرور غير متطابقتين');
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
      setError(err.message ?? 'تعذّر تغيير كلمة المرور');
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="card form-card">
        <div className="alert alert-error">
          رابط إعادة التعيين ناقص أو غير صالح.{' '}
          <Link href="/forgot-password" style={{ color: 'var(--primary)' }}>
            اطلب رابط جديد
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card form-card">
      <h1 className="page-title">تعيين كلمة مرور جديدة</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {done && <div className="alert alert-success">تم تغيير كلمة المرور! جارٍ تحويلك لتسجيل الدخول…</div>}
      {!done && (
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>كلمة المرور الجديدة (6 أحرف على الأقل)</label>
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
            <label>تأكيد كلمة المرور</label>
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
            {busy ? 'جارٍ الحفظ…' : 'تغيير كلمة المرور'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="muted">جارٍ التحميل…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
