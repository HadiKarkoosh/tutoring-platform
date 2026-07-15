'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api, SessionUser } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api<{ accessToken: string; user: SessionUser }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      );
      login(res.accessToken, res.user);
      router.push(
        res.user.role === 'tutor' ? '/dashboard/tutor' : '/dashboard/student',
      );
    } catch (err: any) {
      setError(err.message ?? 'تعذّر تسجيل الدخول');
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
  }

  return (
    <div className="card form-card">
      <h1 className="page-title">تسجيل الدخول</h1>
      <p className="page-subtitle">أهلاً بعودتك!</p>

      <div className="demo-box">
        💡 <strong>للتجربة السريعة كمدرّس:</strong>
        <br />
        البريد: <code dir="ltr">tutor@demo.com</code> — كلمة المرور: <code dir="ltr">Demo1234</code>
        <br />
        <button
          type="button"
          className="btn btn-sm"
          style={{ marginTop: 8 }}
          onClick={() => fillDemo('tutor@demo.com', 'Demo1234')}
        >
          تعبئة تلقائية
        </button>
      </div>

      <div className="demo-box">
        💡 <strong>للتجربة السريعة كطالب:</strong>
        <br />
        البريد: <code dir="ltr">student@demo.com</code> — كلمة المرور: <code dir="ltr">Demo1234</code>
        <br />
        <button
          type="button"
          className="btn btn-sm"
          style={{ marginTop: 8 }}
          onClick={() => fillDemo('student@demo.com', 'Demo1234')}
        >
          تعبئة تلقائية
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
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
        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label style={{ marginBottom: 0 }}>كلمة المرور</label>
            <Link href="/forgot-password" style={{ color: 'var(--primary-light)', fontSize: 13 }}>
              نسيت كلمة المرور؟
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            dir="ltr"
            style={{ marginTop: 6 }}
          />
        </div>
        <button className="btn" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'جارٍ الدخول…' : 'دخول'}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
        ما عندك حساب؟ <Link href="/register" style={{ color: 'var(--primary)' }}>سجّل الآن</Link>
      </p>
    </div>
  );
}
