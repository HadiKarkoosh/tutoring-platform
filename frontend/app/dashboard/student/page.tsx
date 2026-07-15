'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, Booking, formatSlot } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function StudentDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    api<Booking[]>('/bookings/me', {}, token)
      .then(setBookings)
      .catch((e: any) => setError(e.message ?? 'تعذّر التحميل'))
      .finally(() => setLoading(false));
  }, [token]);

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
      setError(err.message ?? 'تعذّر الإلغاء');
    } finally {
      setCancelling(null);
    }
  }

  if (authLoading || !user) return <p className="muted">جارٍ التحميل…</p>;

  return (
    <>
      <h1 className="page-title">حجوزاتي</h1>
      <p className="page-subtitle">مرحباً {user.name} 👋</p>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {loading && <p className="muted">جارٍ التحميل…</p>}
        {!loading && bookings.length === 0 && (
          <p className="muted">
            ما عندك حجوزات بعد — <Link href="/" style={{ color: 'var(--primary)' }}>تصفح المدرّسين</Link>
          </p>
        )}
        {bookings.map((b) => (
          <div key={b.id} className="slot-row">
            <div>
              <div>🗓️ {formatSlot(b.slot)}</div>
              <span className="badge" style={{ marginTop: 4 }}>
                {b.status === 'confirmed' ? 'مؤكد' : 'ملغى'}
              </span>
            </div>
            {b.status === 'confirmed' && (
              <button
                className="btn btn-danger btn-sm"
                disabled={cancelling === b.id}
                onClick={() => cancel(b.id)}
              >
                {cancelling === b.id ? 'جارٍ الإلغاء…' : 'إلغاء الحجز'}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
