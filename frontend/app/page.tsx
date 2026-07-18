'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, Subject, Tutor } from '../lib/api';
import Stars from '../components/stars';
import { useT } from '../lib/i18n';

const TEXT = {
  heroTitle: { ar: 'ابحث عن مدرّسك المثالي', en: 'Find your ideal tutor' },
  heroSub: {
    ar: 'تصفح المدرّسين حسب المادة، شوف مواعيدهم المتاحة، واحجز درسك بضغطة زر.',
    en: 'Browse tutors by subject, check their available slots, and book your lesson in one click.',
  },
  searchPlaceholder: { ar: '🔍 دوّر باسم المدرّس…', en: '🔍 Search by tutor name…' },
  all: { ar: 'الكل', en: 'All' },
  connectError: {
    ar: 'تعذّر الاتصال بالخادم — تأكد أن الباك اند شغّال على المنفذ 4000',
    en: 'Could not reach the server — make sure the backend is running',
  },
  loading: { ar: 'جارٍ التحميل…', en: 'Loading…' },
  noTutors: { ar: 'لا يوجد مدرّسون', en: 'No tutors found' },
  forSubject: { ar: 'لمادة', en: 'for subject' },
  matching: { ar: 'يطابقون', en: 'matching' },
  perHour: { ar: '/ ساعة', en: '/ hour' },
};

export default function HomePage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const t = useT(TEXT);

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
        .catch(() => setError(t.connectError))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [filter, search, t.connectError]);

  return (
    <>
      <div className="hero">
        <h1>{t.heroTitle}</h1>
        <p>{t.heroSub}</p>
      </div>

      <div className="field" style={{ maxWidth: 360 }}>
        <input
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filters">
        <button
          className={`chip ${filter === '' ? 'active' : ''}`}
          onClick={() => setFilter('')}
        >
          {t.all}
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
      {loading && <p className="muted">{t.loading}</p>}
      {!loading && !error && tutors.length === 0 && (
        <p className="muted">
          {t.noTutors}
          {filter ? ` ${t.forSubject} ${filter}` : ''}
          {search ? ` ${t.matching} "${search}"` : ''}.
        </p>
      )}

      <div className="grid">
        {tutors.map((tut) => (
          <Link key={tut.id} href={`/tutors/${tut.id}`}>
            <div className="card" style={{ height: '100%' }}>
              <h3 style={{ marginBottom: 4 }}>{tut.name}</h3>
              <div style={{ marginBottom: 6 }}>
                <Stars rating={tut.avgRating} />
              </div>
              {tut.hourlyRate != null && (
                <p className="muted" style={{ marginBottom: 8 }}>
                  💰 {tut.hourlyRate} {t.perHour}
                </p>
              )}
              {tut.bio && (
                <p className="muted" style={{ marginBottom: 12 }}>
                  {tut.bio.length > 100 ? tut.bio.slice(0, 100) + '…' : tut.bio}
                </p>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {tut.subjects.map((s) => (
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
