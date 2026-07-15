'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  function goToTutors() {
    // A Link to "/" is a no-op when already on "/" — no navigation event
    // fires, so nothing visibly happens. Always force a real transition:
    // navigate first (harmless if already there), then scroll to the
    // listing regardless of which page we started from.
    router.push('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand">
          📚 منصة الدروس
        </Link>
        <div className="nav-links">
          <button
            type="button"
            className="nav-link"
            onClick={goToTutors}
            style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer' }}
          >
            المدرّسون
          </button>
          {!loading && user && (
            <>
              <Link
                href={
                  user.role === 'tutor'
                    ? '/dashboard/tutor'
                    : '/dashboard/student'
                }
                className="nav-link"
              >
                لوحة التحكم
              </Link>
              <span className="badge badge-muted">{user.name}</span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  logout();
                  router.push('/');
                }}
              >
                خروج
              </button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link href="/login" className="nav-link">
                دخول
              </Link>
              <Link href="/register" className="btn btn-sm">
                إنشاء حساب
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
