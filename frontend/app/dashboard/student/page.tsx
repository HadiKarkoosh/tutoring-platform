'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, Booking, formatSlot } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { useLang, useT } from '../../../lib/i18n';

const TEXT = {
  loading: { ar: 'جارٍ التحميل…', en: 'Loading…' },
  myBookings: { ar: 'حجوزاتي', en: 'My bookings' },
  welcome: { ar: 'مرحباً', en: 'Welcome' },
  noBookings: { ar: 'ما عندك حجوزات بعد —', en: "You don't have any bookings yet —" },
  browseTutors: { ar: 'تصفح المدرّسين', en: 'Browse tutors' },
  confirmed: { ar: 'مؤكد', en: 'Confirmed' },
  cancelled: { ar: 'ملغى', en: 'Cancelled' },
  cancelling: { ar: 'جارٍ الإلغاء…', en: 'Cancelling…' },
  cancelBooking: { ar: 'إلغاء الحجز', en: 'Cancel booking' },
  loadFailed: { ar: 'تعذّر التحميل', en: 'Could not load' },
  cancelFailed: { ar: 'تعذّر الإلغاء', en: 'Could not cancel' },
};

export default function StudentDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const { lang } = useLang();
  const t = useT(TEXT);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    api<Booking[]>('/bookings/me', {}, token)
      .then(setBookings)
      .catch((e: any) => setError(e.message ?? t.loadFailed))
      .finally(() => setLoading(false));
  }, [token, t.loadFailed]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'student')) {
      router.push('/login');
      return;
    }
    load();
  }, [authLoading, user, router, load]);

  async function cancel(id: string) {
    setError('');
    setCancelling(id);
    try {
      await api(`/bookings/${id}`, { method: 'DELETE' }, token);
      load();
    } catch (err: any) {
      setError(err.message ?? t.cancelFailed);
    } finally {
      setCancelling(null);
    }
  }

  if (authLoading || !user) return <p className="muted">{t.loading}</p>;

  return (
    <>
      <h1 className="page-title">{t.myBookings}</h1>
      <p className="page-subtitle">{t.welcome} {user.name} 👋</p>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {loading && <p className="muted">{t.loading}</p>}
        {!loading && bookings.length === 0 && (
          <p className="muted">
            {t.noBookings} <Link href="/" style={{ color: 'var(--primary)' }}>{t.browseTutors}</Link>
          </p>
        )}
        {bookings.map((b) => (
          <div key={b.id} className="slot-row">
            <div>
              <div>🗓️ {formatSlot(b.slot, lang)}</div>
              <span className="badge" style={{ marginTop: 4 }}>
                {b.status === 'confirmed' ? t.confirmed : t.cancelled}
              </span>
            </div>
            {b.status === 'confirmed' && (
              <button
                className="btn btn-danger btn-sm"
                disabled={cancelling === b.id}
                onClick={() => cancel(b.id)}
              >
                {cancelling === b.id ? t.cancelling : t.cancelBooking}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
