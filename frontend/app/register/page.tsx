'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { api, SessionUser, Subject } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

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
      setError('كلمتا المرور غير متطابقتين');
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
      setError(err.message ?? 'تعذّر إنشاء الحساب');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card form-card">
      <h1 className="page-title">إنشاء حساب</h1>
      <p className="page-subtitle">انضم كطالب أو كمدرّس</p>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>الاسم</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
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
          <label>كلمة المرور (6 أحرف على الأقل)</label>
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
        <div className="field">
          <label>نوع الحساب</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'student' | 'tutor')}
          >
            <option value="student">طالب</option>
            <option value="tutor">مدرّس</option>
          </select>
        </div>

        {role === 'tutor' && (
          <>
            <div className="field">
              <label>نبذة عنك</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="خبرتك، أسلوبك بالتدريس…"
              />
            </div>
            <div className="field">
              <label>سعر الساعة</label>
              <input
                type="number"
                min={0}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="field">
              <label>المواد التي تدرّسها</label>
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
          {busy ? 'جارٍ الإنشاء…' : 'إنشاء الحساب'}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
        عندك حساب؟ <Link href="/login" style={{ color: 'var(--primary)' }}>سجّل دخولك</Link>
      </p>
    </div>
  );
}
