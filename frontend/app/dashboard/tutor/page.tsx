'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, Booking, formatSlot, Slot } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function TutorDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    api<Slot[]>('/tutors/me/slots', {}, token).then(setSlots).catch(() => {});
    api<Booking[]>('/tutors/me/bookings', {}, token)
      .then(setBookings)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'tutor')) {
      router.push('/login');
      return;
    }
    load();
  }, [authLoading, user, router, load]);

  async function addSlot(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      await api(
        '/tutors/me/slots',
        {
          method: 'POST',
          body: JSON.stringify({
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
          }),
        },
        token,
      );
      setSuccess('تمت إضافة الموعد');
      setStartTime('');
      setEndTime('');
      load();
    } catch (err: any) {
      setError(err.message ?? 'تعذّرت الإضافة');
    } finally {
      setBusy(false);
    }
  }

  async function removeSlot(id: string) {
    setError('');
    setSuccess('');
    try {
      await api(`/tutors/me/slots/${id}`, { method: 'DELETE' }, token);
      load();
    } catch (err: any) {
      setError(err.message ?? 'تعذّر الحذف');
    }
  }

  if (authLoading || !user) return <p className="muted">جارٍ التحميل…</p>;

  return (
    <>
      <h1 className="page-title">لوحة المدرّس</h1>
      <p className="page-subtitle">مرحباً {user.name} 👋</p>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 12 }}>إضافة موعد متاح</h2>
        <form
          onSubmit={addSlot}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}
        >
          <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
            <label>من</label>
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              dir="ltr"
            />
          </div>
          <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
            <label>إلى</label>
            <input
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              dir="ltr"
            />
          </div>
          <button className="btn" disabled={busy}>
            {busy ? 'جارٍ الإضافة…' : 'أضف الموعد'}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 12 }}>مواعيدي</h2>
        {slots.length === 0 && <p className="muted">لا توجد مواعيد بعد.</p>}
        {slots.map((s) => (
          <div key={s.id} className="slot-row">
            <span>
              🗓️ {formatSlot(s)}{' '}
              {s.isBooked ? (
                <span className="badge">محجوز</span>
              ) : (
                <span className="badge badge-muted">متاح</span>
              )}
            </span>
            {!s.isBooked && (
              <button className="btn btn-danger btn-sm" onClick={() => removeSlot(s.id)}>
                حذف
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 12 }}>الحجوزات الواردة</h2>
        {bookings.length === 0 && <p className="muted">لا توجد حجوزات بعد.</p>}
        {bookings.map((b) => (
          <div key={b.id} className="slot-row">
            <div>
              <div>🗓️ {formatSlot(b.slot)}</div>
              {b.student && (
                <div className="muted">
                  👤 {b.student.name} — <span dir="ltr">{b.student.email}</span>
                </div>
              )}
            </div>
            <span className="badge">مؤكد</span>
          </div>
        ))}
      </div>
    </>
  );
}
