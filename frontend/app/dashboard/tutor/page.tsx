'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, Booking, formatSlot, Slot, Subject, Tutor } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { useLang, useT } from '../../../lib/i18n';

const TEXT = {
  loading: { ar: 'جارٍ التحميل…', en: 'Loading…' },
  tutorDashboard: { ar: 'لوحة المدرّس', en: 'Tutor dashboard' },
  welcome: { ar: 'مرحباً', en: 'Welcome' },
  myProfile: { ar: 'ملفي الشخصي', en: 'My profile' },
  bio: { ar: 'نبذة عنك', en: 'About you' },
  hourlyRate: { ar: 'سعر الساعة', en: 'Hourly rate' },
  subjectsLabel: { ar: 'المواد التي تدرّسها', en: 'Subjects you teach' },
  saving: { ar: 'جارٍ الحفظ…', en: 'Saving…' },
  saveChanges: { ar: 'حفظ التعديلات', en: 'Save changes' },
  addSlotTitle: { ar: 'إضافة موعد متاح', en: 'Add an available slot' },
  from: { ar: 'من', en: 'From' },
  to: { ar: 'إلى', en: 'To' },
  adding: { ar: 'جارٍ الإضافة…', en: 'Adding…' },
  addSlot: { ar: 'أضف الموعد', en: 'Add slot' },
  mySlots: { ar: 'مواعيدي', en: 'My slots' },
  noSlots: { ar: 'لا توجد مواعيد بعد.', en: 'No slots yet.' },
  booked: { ar: 'محجوز', en: 'Booked' },
  available: { ar: 'متاح', en: 'Available' },
  edit: { ar: 'تعديل', en: 'Edit' },
  delete: { ar: 'حذف', en: 'Delete' },
  cancel: { ar: 'إلغاء', en: 'Cancel' },
  save: { ar: 'حفظ', en: 'Save' },
  incomingBookings: { ar: 'الحجوزات الواردة', en: 'Incoming bookings' },
  noBookings: { ar: 'لا توجد حجوزات بعد.', en: 'No bookings yet.' },
  confirmed: { ar: 'مؤكد', en: 'Confirmed' },
  slotAdded: { ar: 'تمت إضافة الموعد', en: 'Slot added' },
  addFailed: { ar: 'تعذّرت الإضافة', en: 'Could not add the slot' },
  deleteFailed: { ar: 'تعذّر الحذف', en: 'Could not delete' },
  editFailed: { ar: 'تعذّر تعديل الموعد', en: 'Could not edit the slot' },
  profileSaved: { ar: 'تم حفظ التعديلات', en: 'Changes saved' },
  saveFailed: { ar: 'تعذّر الحفظ', en: 'Could not save' },
};

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
  const { lang } = useLang();
  const t = useT(TEXT);

  const load = useCallback(() => {
    if (!token || !user) return;
    api<Slot[]>('/tutors/me/slots', {}, token).then(setSlots).catch(() => {});
    api<Booking[]>('/tutors/me/bookings', {}, token)
      .then(setBookings)
      .catch(() => {});
    api<Tutor>(`/tutors/${user.id}`).then((tut) => {
      setBio(tut.bio ?? '');
      setHourlyRate(tut.hourlyRate != null ? String(tut.hourlyRate) : '');
      setSelectedSubjects(tut.subjects.map((s) => s.id));
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
      setSuccess(t.slotAdded);
      setStartTime('');
      setEndTime('');
      load();
    } catch (err: any) {
      setError(err.message ?? t.addFailed);
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
      setError(err.message ?? t.deleteFailed);
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
      setError(err.message ?? t.editFailed);
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
      setProfileMessage(t.profileSaved);
    } catch (err: any) {
      setProfileError(err.message ?? t.saveFailed);
    } finally {
      setProfileBusy(false);
    }
  }

  if (authLoading || !user) return <p className="muted">{t.loading}</p>;

  return (
    <>
      <h1 className="page-title">{t.tutorDashboard}</h1>
      <p className="page-subtitle">{t.welcome} {user.name} 👋</p>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 12 }}>{t.myProfile}</h2>
        {profileError && <div className="alert alert-error">{profileError}</div>}
        {profileMessage && <div className="alert alert-success">{profileMessage}</div>}
        <form onSubmit={saveProfile}>
          <div className="field">
            <label>{t.bio}</label>
            <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="field" style={{ maxWidth: 200 }}>
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
                  className={`chip ${selectedSubjects.includes(s.id) ? 'active' : ''}`}
                  onClick={() => toggleSubject(s.id)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-sm" disabled={profileBusy}>
            {profileBusy ? t.saving : t.saveChanges}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 12 }}>{t.addSlotTitle}</h2>
        <form
          onSubmit={addSlot}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}
        >
          <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
            <label>{t.from}</label>
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              dir="ltr"
            />
          </div>
          <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
            <label>{t.to}</label>
            <input
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              dir="ltr"
            />
          </div>
          <button className="btn" disabled={busy}>
            {busy ? t.adding : t.addSlot}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 12 }}>{t.mySlots}</h2>
        {slots.length === 0 && <p className="muted">{t.noSlots}</p>}
        {slots.map((s) =>
          editingSlotId === s.id ? (
            <div key={s.id} className="slot-row" style={{ gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
                <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 180 }}>
                  <label>{t.from}</label>
                  <input
                    type="datetime-local"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 180 }}>
                  <label>{t.to}</label>
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
                  {editBusy ? t.saving : t.save}
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setEditingSlotId(null)}
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div key={s.id} className="slot-row">
              <span>
                🗓️ {formatSlot(s, lang)}{' '}
                {s.isBooked ? (
                  <span className="badge">{t.booked}</span>
                ) : (
                  <span className="badge badge-muted">{t.available}</span>
                )}
              </span>
              {!s.isBooked && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => startEdit(s)}>
                    {t.edit}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => removeSlot(s.id)}>
                    {t.delete}
                  </button>
                </div>
              )}
            </div>
          ),
        )}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 12 }}>{t.incomingBookings}</h2>
        {bookings.length === 0 && <p className="muted">{t.noBookings}</p>}
        {bookings.map((b) => (
          <div key={b.id} className="slot-row">
            <div>
              <div>🗓️ {formatSlot(b.slot, lang)}</div>
              {b.student && (
                <div className="muted">
                  👤 {b.student.name} — <span dir="ltr">{b.student.email}</span>
                </div>
              )}
            </div>
            <span className="badge">{t.confirmed}</span>
          </div>
        ))}
      </div>
    </>
  );
}
