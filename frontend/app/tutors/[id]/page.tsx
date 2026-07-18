'use client';

import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, formatSlot, Tutor } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { useLang, useT } from '../../../lib/i18n';
import Stars from '../../../components/stars';

const TEXT = {
  loading: { ar: 'جارٍ التحميل…', en: 'Loading…' },
  notFound: { ar: 'المدرّس غير موجود', en: 'Tutor not found' },
  perHour: { ar: '/ ساعة', en: '/ hour' },
  availableSlots: { ar: 'المواعيد المتاحة', en: 'Available slots' },
  noSlots: { ar: 'لا توجد مواعيد متاحة حالياً.', en: 'No available slots right now.' },
  booking: { ar: 'جارٍ الحجز…', en: 'Booking…' },
  bookNow: { ar: 'احجز', en: 'Book' },
  loginToBook: { ar: 'سجّل دخول للحجز', en: 'Log in to book' },
  available: { ar: 'متاح', en: 'Available' },
  reviews: { ar: 'التقييمات', en: 'Reviews' },
  yourRating: { ar: 'تقييمك', en: 'Your rating' },
  commentOptional: { ar: 'تعليق (اختياري)', en: 'Comment (optional)' },
  commentPlaceholder: { ar: 'كيف كانت تجربتك مع هالمدرّس؟', en: 'How was your experience with this tutor?' },
  sending: { ar: 'جارٍ الإرسال…', en: 'Sending…' },
  sendReview: { ar: 'إرسال التقييم', en: 'Submit review' },
  reviewNote: {
    ar: 'لازم يكون عندك حجز مع هالمدرّس مسبقاً حتى تقدر تقيّمه.',
    en: 'You need a prior booking with this tutor to review them.',
  },
  noReviews: { ar: 'لا توجد تقييمات بعد.', en: 'No reviews yet.' },
  loadTutorFailed: { ar: 'تعذّر تحميل المدرّس', en: 'Could not load the tutor' },
  bookSuccess: { ar: 'تم الحجز بنجاح! تلاقيه بلوحة التحكم.', en: 'Booked successfully! Check your dashboard.' },
  bookFailed: { ar: 'تعذّر الحجز', en: 'Could not book' },
  reviewFailed: { ar: 'تعذّر إرسال التقييم', en: 'Could not submit the review' },
};

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
  const { lang } = useLang();
  const t = useT(TEXT);

  const load = useCallback(() => {
    setLoading(true);
    api<Tutor>(`/tutors/${id}`)
      .then(setTutor)
      .catch((e: any) => setError(e.message ?? t.loadTutorFailed))
      .finally(() => setLoading(false));
  }, [id, t.loadTutorFailed]);

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
      setSuccess(t.bookSuccess);
      load();
    } catch (err: any) {
      setError(err.message ?? t.bookFailed);
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
      setReviewError(err.message ?? t.reviewFailed);
    } finally {
      setReviewBusy(false);
    }
  }

  if (loading) return <p className="muted">{t.loading}</p>;
  if (!tutor) return <div className="alert alert-error">{error || t.notFound}</div>;

  return (
    <>
      <div className="card" style={{ marginBottom: 24 }}>
        <h1 className="page-title">{tutor.name}</h1>
        <div style={{ marginBottom: 8 }}>
          <Stars rating={tutor.avgRating} count={tutor.reviewCount} />
        </div>
        {tutor.hourlyRate != null && (
          <p className="muted" style={{ marginBottom: 8 }}>
            💰 {tutor.hourlyRate} {t.perHour}
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
        <h2 style={{ marginBottom: 12 }}>{t.availableSlots}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        {(tutor.availableSlots ?? []).length === 0 && (
          <p className="muted">{t.noSlots}</p>
        )}
        {(tutor.availableSlots ?? []).map((slot) => (
          <div key={slot.id} className="slot-row">
            <span>🗓️ {formatSlot(slot, lang)}</span>
            {user?.role === 'student' || !user ? (
              <button
                className="btn btn-sm"
                disabled={bookingSlot === slot.id}
                onClick={() => book(slot.id)}
              >
                {bookingSlot === slot.id
                  ? t.booking
                  : user
                    ? t.bookNow
                    : t.loginToBook}
              </button>
            ) : (
              <span className="badge badge-muted">{t.available}</span>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 12 }}>{t.reviews} {tutor.reviewCount ? `(${tutor.reviewCount})` : ''}</h2>

        {user?.role === 'student' && (
          <form onSubmit={submitReview} style={{ marginBottom: 20 }}>
            {reviewError && <div className="alert alert-error">{reviewError}</div>}
            <div className="field">
              <label>{t.yourRating}</label>
              <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {'★'.repeat(n)} ({n}/5)
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t.commentOptional}</label>
              <textarea
                rows={2}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={t.commentPlaceholder}
              />
            </div>
            <button className="btn btn-sm" disabled={reviewBusy}>
              {reviewBusy ? t.sending : t.sendReview}
            </button>
            <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
              {t.reviewNote}
            </p>
          </form>
        )}

        {(tutor.reviews ?? []).length === 0 && <p className="muted">{t.noReviews}</p>}
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
