'use client';

import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, formatSlot, Tutor } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import Stars from '../../../components/stars';

export default function TutorPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const router = useRouter();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api<Tutor>(`/tutors/${id}`)
      .then(setTutor)
      .catch((e: any) => setError(e.message ?? 'تعذّر تحميل المدرّس'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  async function book(slotId: string) {
    if (!user) {
      router.push('/login');
      return;
    }
    setError('');
    setSuccess('');
    setBookingSlot(slotId);
    try {
      await api('/bookings', { method: 'POST', body: JSON.stringify({ slotId }) }, token);
      setSuccess('تم الحجز بنجاح! تلاقيه بلوحة التحكم.');
      load();
    } catch (err: any) {
      setError(err.message ?? 'تعذّر الحجز');
      if (err.status === 409) load(); // slot taken meanwhile — refresh list
    } finally {
      setBookingSlot(null);
    }
  }

  async function submitReview(e: FormEvent) {
    e.preventDefault();
    setReviewError('');
    setReviewBusy(true);
    try {
      await api(
        '/reviews',
        {
          method: 'POST',
          body: JSON.stringify({ tutorId: id, rating: reviewRating, comment: reviewComment || undefined }),
        },
        token,
      );
      setReviewComment('');
      load();
    } catch (err: any) {
      setReviewError(err.message ?? 'تعذّر إرسال التقييم');
    } finally {
      setReviewBusy(false);
    }
  }

  if (loading) return <p className="muted">جارٍ التحميل…</p>;
  if (!tutor) return <div className="alert alert-error">{error || 'المدرّس غير موجود'}</div>;

  return (
    <>
      <div className="card" style={{ marginBottom: 24 }}>
        <h1 className="page-title">{tutor.name}</h1>
        <div style={{ marginBottom: 8 }}>
          <Stars rating={tutor.avgRating} count={tutor.reviewCount} />
        </div>
        {tutor.hourlyRate != null && (
          <p className="muted" style={{ marginBottom: 8 }}>
            💰 {tutor.hourlyRate} / ساعة
          </p>
        )}
        {tutor.bio && <p style={{ marginBottom: 12 }}>{tutor.bio}</p>}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tutor.subjects.map((s) => (
            <span key={s.id} className="badge">
              {s.name}
            </span>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 12 }}>المواعيد المتاحة</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        {(tutor.availableSlots ?? []).length === 0 && (
          <p className="muted">لا توجد مواعيد متاحة حالياً.</p>
        )}
        {(tutor.availableSlots ?? []).map((slot) => (
          <div key={slot.id} className="slot-row">
            <span>🗓️ {formatSlot(slot)}</span>
            {user?.role === 'student' || !user ? (
              <button
                className="btn btn-sm"
                disabled={bookingSlot === slot.id}
                onClick={() => book(slot.id)}
              >
                {bookingSlot === slot.id
                  ? 'جارٍ الحجز…'
                  : user
                    ? 'احجز'
                    : 'سجّل دخول للحجز'}
              </button>
            ) : (
              <span className="badge badge-muted">متاح</span>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 12 }}>التقييمات {tutor.reviewCount ? `(${tutor.reviewCount})` : ''}</h2>

        {user?.role === 'student' && (
          <form onSubmit={submitReview} style={{ marginBottom: 20 }}>
            {reviewError && <div className="alert alert-error">{reviewError}</div>}
            <div className="field">
              <label>تقييمك</label>
              <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {'★'.repeat(n)} ({n}/5)
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>تعليق (اختياري)</label>
              <textarea
                rows={2}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="كيف كانت تجربتك مع هالمدرّس؟"
              />
            </div>
            <button className="btn btn-sm" disabled={reviewBusy}>
              {reviewBusy ? 'جارٍ الإرسال…' : 'إرسال التقييم'}
            </button>
            <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
              لازم يكون عندك حجز مع هالمدرّس مسبقاً حتى تقدر تقيّمه.
            </p>
          </form>
        )}

        {(tutor.reviews ?? []).length === 0 && <p className="muted">لا توجد تقييمات بعد.</p>}
        {(tutor.reviews ?? []).map((r) => (
          <div key={r.id} className="slot-row" style={{ alignItems: 'flex-start' }}>
            <div>
              <div style={{ marginBottom: 4 }}>
                <span dir="ltr" style={{ color: 'var(--accent)' }}>
                  {'★'.repeat(r.rating)}
                  <span style={{ opacity: 0.3 }}>{'★'.repeat(5 - r.rating)}</span>
                </span>
              </div>
              {r.comment && <p className="muted">{r.comment}</p>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
