'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, Booking, formatSlot, Slot, Subject, Tutor } from '../../../lib/api';
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

  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editBusy, setEditBusy] = useState(false);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const load = useCallback(() => {
    if (!token || !user) return;
    api<Slot[]>('/tutors/me/slots', {}, token).then(setSlots).catch(() => {});
    api<Booking[]>('/tutors/me/bookings', {}, token)
      .then(setBookings)
      .catch(() => {});
    api<Tutor>(`/tutors/${user.id}`).then((t) => {
      setBio(t.bio ?? '');
      setHourlyRate(t.hourlyRate != null ? String(t.hourlyRate) : '');
      setSelectedSubjects(t.subjects.map((s) => s.id));
    });
  }, [token, user]);

  useEffect(() => {
    api<Subject[]>('/subjects').then(setSubjects).catch(() => {});
  }, []);

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

  function startEdit(slot: Slot) {
    setEditingSlotId(slot.id);
    setEditStart(slot.startTime.slice(0, 16));
    setEditEnd(slot.endTime.slice(0, 16));
  }

  async function saveEdit(id: string) {
    setError('');
    setSuccess('');
    setEditBusy(true);
    try {
      await api(
        `/tutors/me/slots/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            startTime: new Date(editStart).toISOString(),
            endTime: new Date(editEnd).toISOString(),
          }),
        },
        token,
      );
      setEditingSlotId(null);
      load();
    } catch (err: any) {
      setError(err.message ?? 'تعذّر تعديل الموعد');
    } finally {
      setEditBusy(false);
    }
  }

  function toggleSubject(id: number) {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileError('');
    setProfileMessage('');
    setProfileBusy(true);
    try {
      await api(
        '/tutors/me',
        {
          method: 'PATCH',
          body: JSON.stringify({
            bio: bio || undefined,
            hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
            subjectIds: selectedSubjects,
          }),
        },
        token,
      );
      setProfileMessage('تم حفظ التعديلات');
    } catch (err: any) {
      setProfileError(err.message ?? 'تعذّر الحفظ');
    } finally {
      setProfileBusy(false);
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
        <h2 style={{ marginBottom: 12 }}>ملفي الشخصي</h2>
        {profileError && <div className="alert alert-error">{profileError}</div>}
        {profileMessage && <div className="alert alert-success">{profileMessage}</div>}
        <form onSubmit={saveProfile}>
          <div className="field">
            <label>نبذة عنك</label>
            <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="field" style={{ maxWidth: 200 }}>
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
                  className={`chip ${selectedSubjects.includes(s.id) ? 'active' : ''}`}
                  onClick={() => toggleSubject(s.id)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-sm" disabled={profileBusy}>
            {profileBusy ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}
          </button>
        </form>
      </div>

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
        {slots.map((s) =>
          editingSlotId === s.id ? (
            <div key={s.id} className="slot-row" style={{ gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
                <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 180 }}>
                  <label>من</label>
                  <input
                    type="datetime-local"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 180 }}>
                  <label>إلى</label>
                  <input
                    type="datetime-local"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    dir="ltr"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm" disabled={editBusy} onClick={() => saveEdit(s.id)}>
                  {editBusy ? 'جارٍ الحفظ…' : 'حفظ'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setEditingSlotId(null)}
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
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
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => startEdit(s)}>
                    تعديل
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => removeSlot(s.id)}>
                    حذف
                  </button>
                </div>
              )}
            </div>
          ),
        )}
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
