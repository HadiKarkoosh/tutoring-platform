'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api, SessionUser } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useT } from '../../lib/i18n';

const TEXT = {
  title: { ar: 'تسجيل الدخول', en: 'Log in' },
  subtitle: { ar: 'أهلاً بعودتك!', en: 'Welcome back!' },
  demoTutorTitle: { ar: 'للتجربة السريعة كمدرّس:', en: 'Quick tutor demo:' },
  demoStudentTitle: { ar: 'للتجربة السريعة كطالب:', en: 'Quick student demo:' },
  emailLabel: { ar: 'البريد:', en: 'Email:' },
  passwordLabel: { ar: 'كلمة المرور:', en: 'Password:' },
  autofill: { ar: 'تعبئة تلقائية', en: 'Auto-fill' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  password: { ar: 'كلمة المرور', en: 'Password' },
  forgotPassword: { ar: 'نسيت كلمة المرور؟', en: 'Forgot password?' },
  loggingIn: { ar: 'جارٍ الدخول…', en: 'Logging in…' },
  submit: { ar: 'دخول', en: 'Log in' },
  noAccount: { ar: 'ما عندك حساب؟', en: "Don't have an account?" },
  registerNow: { ar: 'سجّل الآن', en: 'Sign up' },
  loginFailed: { ar: 'تعذّر تسجيل الدخول', en: 'Could not log in' },
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const t = useT(TEXT);

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
      setError(err.message ?? t.loginFailed);
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
      <h1 className="page-title">{t.title}</h1>
      <p className="page-subtitle">{t.subtitle}</p>

      <div className="demo-box">
        💡 <strong>{t.demoTutorTitle}</strong>
        <br />
        {t.emailLabel} <code dir="ltr">tutor@demo.com</code> — {t.passwordLabel} <code dir="ltr">Demo1234</code>
        <br />
        <button
          type="button"
          className="btn btn-sm"
          style={{ marginTop: 8 }}
          onClick={() => fillDemo('tutor@demo.com', 'Demo1234')}
        >
          {t.autofill}
        </button>
      </div>

      <div className="demo-box">
        💡 <strong>{t.demoStudentTitle}</strong>
        <br />
        {t.emailLabel} <code dir="ltr">student@demo.com</code> — {t.passwordLabel} <code dir="ltr">Demo1234</code>
        <br />
        <button
          type="button"
          className="btn btn-sm"
          style={{ marginTop: 8 }}
          onClick={() => fillDemo('student@demo.com', 'Demo1234')}
        >
          {t.autofill}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
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
        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label style={{ marginBottom: 0 }}>{t.password}</label>
            <Link href="/forgot-password" style={{ color: 'var(--primary-light)', fontSize: 13 }}>
              {t.forgotPassword}
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
          {busy ? t.loggingIn : t.submit}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
        {t.noAccount} <Link href="/register" style={{ color: 'var(--primary)' }}>{t.registerNow}</Link>
      </p>
    </div>
  );
}
