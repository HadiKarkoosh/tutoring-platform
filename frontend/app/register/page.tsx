'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { api, SessionUser, Subject } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useT } from '../../lib/i18n';

const TEXT = {
  title: { ar: 'إنشاء حساب', en: 'Create an account' },
  subtitle: { ar: 'انضم كطالب أو كمدرّس', en: 'Join as a student or a tutor' },
  name: { ar: 'الاسم', en: 'Name' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  password: { ar: 'كلمة المرور (6 أحرف على الأقل)', en: 'Password (6+ characters)' },
  passwordConfirm: { ar: 'تأكيد كلمة المرور', en: 'Confirm password' },
  accountType: { ar: 'نوع الحساب', en: 'Account type' },
  student: { ar: 'طالب', en: 'Student' },
  tutor: { ar: 'مدرّس', en: 'Tutor' },
  bio: { ar: 'نبذة عنك', en: 'About you' },
  bioPlaceholder: { ar: 'خبرتك، أسلوبك بالتدريس…', en: 'Your experience, teaching style…' },
  hourlyRate: { ar: 'سعر الساعة', en: 'Hourly rate' },
  subjectsLabel: { ar: 'المواد التي تدرّسها', en: 'Subjects you teach' },
  creating: { ar: 'جارٍ الإنشاء…', en: 'Creating…' },
  submit: { ar: 'إنشاء الحساب', en: 'Create account' },
  haveAccount: { ar: 'عندك حساب؟', en: 'Already have an account?' },
  loginNow: { ar: 'سجّل دخولك', en: 'Log in' },
  passwordMismatch: { ar: 'كلمتا المرور غير متطابقتين', en: 'Passwords do not match' },
  registerFailed: { ar: 'تعذّر إنشاء الحساب', en: 'Could not create the account' },
};

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [role, setRole] = useState<'student' | 'tutor'>('student');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const t = useT(TEXT);

  useEffect(() => {
    api<Subject[]>('/subjects').then(setSubjects).catch(() => {});
  }, []);

  function toggleSubject(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== passwordConfirm) {
      setError(t.passwordMismatch);
      return;
    }
    setBusy(true);
    try {
      const body: Record<string, unknown> = { name, email, password, role };
      if (role === 'tutor') {
        body.bio = bio || undefined;
        body.hourlyRate = hourlyRate ? Number(hourlyRate) : undefined;
        body.subjectIds = selected;
      }
      const res = await api<{ accessToken: string; user: SessionUser }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify(body) },
      );
      login(res.accessToken, res.user);
      router.push(role === 'tutor' ? '/dashboard/tutor' : '/');
    } catch (err: any) {
      setError(err.message ?? t.registerFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card form-card">
      <h1 className="page-title">{t.title}</h1>
      <p className="page-subtitle">{t.subtitle}</p>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>{t.name}</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
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
          <label>{t.password}</label>
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
          <label>{t.passwordConfirm}</label>
          <input
            type="password"
            required
            minLength={6}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            dir="ltr"
          />
        </div>
        <div className="field">
          <label>{t.accountType}</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'student' | 'tutor')}
          >
            <option value="student">{t.student}</option>
            <option value="tutor">{t.tutor}</option>
          </select>
        </div>

        {role === 'tutor' && (
          <>
            <div className="field">
              <label>{t.bio}</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t.bioPlaceholder}
              />
            </div>
            <div className="field">
              <label>{t.hourlyRate}</label>
              <input
                type="number"
                min={0}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="field">
              <label>{t.subjectsLabel}</label>
              <div className="filters" style={{ marginBottom: 0 }}>
                {subjects.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    className={`chip ${selected.includes(s.id) ? 'active' : ''}`}
                    onClick={() => toggleSubject(s.id)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <button className="btn" style={{ width: '100%' }} disabled={busy}>
          {busy ? t.creating : t.submit}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
        {t.haveAccount} <Link href="/login" style={{ color: 'var(--primary)' }}>{t.loginNow}</Link>
      </p>
    </div>
  );
}
