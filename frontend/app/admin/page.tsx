'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  AdminBooking,
  AdminPricing,
  AdminStats,
  AdminUser,
  api,
} from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

const roleLabel: Record<string, string> = {
  tutor: 'مدرّس',
  student: 'طالب',
  admin: 'إدارة',
};

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('ar', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function AdminDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pricing, setPricing] = useState<AdminPricing | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    Promise.all([
      api<AdminStats>('/admin/stats', {}, token),
      api<AdminPricing>('/admin/pricing', {}, token),
      api<AdminUser[]>('/admin/users', {}, token),
      api<AdminBooking[]>('/admin/bookings', {}, token),
    ])
      .then(([s, p, u, b]) => {
        setStats(s);
        setPricing(p);
        setUsers(u);
        setBookings(b);
      })
      .catch((e: any) => setError(e.message ?? 'تعذّر تحميل بيانات الإدارة'));
  }, [token]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }
    load();
  }, [authLoading, user, router, load]);

  if (authLoading || !user) return <p className="muted">جارٍ التحميل…</p>;

  return (
    <>
      <h1 className="page-title">لوحة الإدارة</h1>
      <p className="page-subtitle">مرحباً {user.name} 👋</p>
      {error && <div className="alert alert-error">{error}</div>}

      {stats && (
        <div className="grid" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="muted" style={{ marginBottom: 6 }}>
              المدرّسون
            </div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.totalTutors}</div>
          </div>
          <div className="card">
            <div className="muted" style={{ marginBottom: 6 }}>
              الطلاب
            </div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.totalStudents}</div>
          </div>
          <div className="card">
            <div className="muted" style={{ marginBottom: 6 }}>
              الحجوزات
            </div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.totalBookings}</div>
          </div>
          <div className="card">
            <div className="muted" style={{ marginBottom: 6 }}>
              التقييمات
            </div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.totalReviews}</div>
          </div>
        </div>
      )}

      {pricing && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 12 }}>الأسعار</h2>

          {pricing.averageBySubject.length > 0 && (
            <>
              <p className="muted" style={{ marginBottom: 8, fontSize: 13 }}>
                متوسط سعر الساعة حسب المادة
              </p>
              <div className="filters" style={{ marginBottom: 20 }}>
                {pricing.averageBySubject.map((row) => (
                  <span key={row.subject} className="badge">
                    {row.subject}: {row.average} ({row.count})
                  </span>
                ))}
              </div>
            </>
          )}

          {pricing.tutors.map((t) => (
            <div key={t.id} className="slot-row">
              <span>
                {t.name}
                {t.subjects.length > 0 && (
                  <span className="muted"> — {t.subjects.join('، ')}</span>
                )}
              </span>
              <span className="badge badge-muted">
                {t.hourlyRate != null ? `${t.hourlyRate} / ساعة` : 'غير محدّد'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 12 }}>المستخدمون ({users.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'right', color: 'var(--muted)', fontSize: 13 }}>
                <th style={{ padding: '6px 8px' }}>الاسم</th>
                <th style={{ padding: '6px 8px' }}>البريد</th>
                <th style={{ padding: '6px 8px' }}>الدور</th>
                <th style={{ padding: '6px 8px' }}>المواد</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px' }}>{u.name}</td>
                  <td style={{ padding: '8px' }} dir="ltr">
                    {u.email}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span className="badge badge-muted">{roleLabel[u.role] ?? u.role}</span>
                  </td>
                  <td style={{ padding: '8px' }} className="muted">
                    {u.subjects.map((s) => s.name).join('، ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 12 }}>كل الحجوزات ({bookings.length})</h2>
        {bookings.length === 0 && <p className="muted">لا توجد حجوزات بعد.</p>}
        {bookings.map((b) => (
          <div key={b.id} className="slot-row">
            <div>
              <div>🗓️ {formatDateTime(b.startTime)}</div>
              <div className="muted">
                {b.tutor.name} ← {b.student.name}
              </div>
            </div>
            <span className="badge">{b.status === 'confirmed' ? 'مؤكد' : 'ملغى'}</span>
          </div>
        ))}
      </div>
    </>
  );
}
