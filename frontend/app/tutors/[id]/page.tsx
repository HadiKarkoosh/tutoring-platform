'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, formatSlot, Tutor } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function TutorPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const router = useRouter();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);

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

  if (loading) return <p className="muted">جارٍ التحميل…</p>;
  if (!tutor) return <div className="alert alert-error">{error || 'المدرّس غير موجود'}</div>;

  return (
    <>
      <div className="card" style={{ marginBottom: 24 }}>
        <h1 className="page-title">{tutor.name}</h1>
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

      <div className="card">
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
    </>
  );
}
