'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, Subject, Tutor } from '../lib/api';
import Stars from '../components/stars';

export default function HomePage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Subject[]>('/subjects').then(setSubjects).catch(() => {});
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filter) params.set('subject', filter);
      if (search.trim()) params.set('search', search.trim());
      const qs = params.toString();
      api<Tutor[]>(`/tutors${qs ? `?${qs}` : ''}`)
        .then(setTutors)
        .catch(() =>
          setError('تعذّر الاتصال بالخادم — تأكد أن الباك اند شغّال على المنفذ 4000'),
        )
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [filter, search]);

  return (
    <>
      <div className="hero">
        <h1>ابحث عن مدرّسك المثالي</h1>
        <p>تصفح المدرّسين حسب المادة، شوف مواعيدهم المتاحة، واحجز درسك بضغطة زر.</p>
      </div>

      <div className="field" style={{ maxWidth: 360 }}>
        <input
          placeholder="🔍 دوّر باسم المدرّس…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filters">
        <button
          className={`chip ${filter === '' ? 'active' : ''}`}
          onClick={() => setFilter('')}
        >
          الكل
        </button>
        {subjects.map((s) => (
          <button
            key={s.id}
            className={`chip ${filter === s.name ? 'active' : ''}`}
            onClick={() => setFilter(s.name)}
          >
            {s.name}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="muted">جارٍ التحميل…</p>}
      {!loading && !error && tutors.length === 0 && (
        <p className="muted">
          لا يوجد مدرّسون{filter ? ` لمادة ${filter}` : ''}
          {search ? ` يطابقون "${search}"` : ''}.
        </p>
      )}

      <div className="grid">
        {tutors.map((t) => (
          <Link key={t.id} href={`/tutors/${t.id}`}>
            <div className="card" style={{ height: '100%' }}>
              <h3 style={{ marginBottom: 4 }}>{t.name}</h3>
              <div style={{ marginBottom: 6 }}>
                <Stars rating={t.avgRating} />
              </div>
              {t.hourlyRate != null && (
                <p className="muted" style={{ marginBottom: 8 }}>
                  💰 {t.hourlyRate} / ساعة
                </p>
              )}
              {t.bio && (
                <p className="muted" style={{ marginBottom: 12 }}>
                  {t.bio.length > 100 ? t.bio.slice(0, 100) + '…' : t.bio}
                </p>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {t.subjects.map((s) => (
                  <span key={s.id} className="badge">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
