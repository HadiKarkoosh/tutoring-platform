'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { useLang, useT } from '../lib/i18n';

const TEXT = {
  brand: { ar: '📚 منصة الدروس', en: '📚 Tutoring Platform' },
  tutors: { ar: 'المدرّسون', en: 'Tutors' },
  dashboard: { ar: 'لوحة التحكم', en: 'Dashboard' },
  logout: { ar: 'خروج', en: 'Log out' },
  login: { ar: 'دخول', en: 'Log in' },
  register: { ar: 'إنشاء حساب', en: 'Sign up' },
};

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { toggle } = useLang();
  const t = useT(TEXT);

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
        <div className="brand-group">
          <Link href="/" className="brand">
            {t.brand}
          </Link>
          <button type="button" className="lang-toggle-btn" onClick={toggle}>
            🌐 <span>EN / عربي</span>
          </button>
        </div>
        <div className="nav-links">
          <button
            type="button"
            className="nav-link"
            onClick={goToTutors}
            style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer' }}
          >
            {t.tutors}
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
                {t.dashboard}
              </Link>
              <span className="badge badge-muted">{user.name}</span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  logout();
                  router.push('/');
                }}
              >
                {t.logout}
              </button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link href="/login" className="nav-link">
                {t.login}
              </Link>
              <Link href="/register" className="btn btn-sm">
                {t.register}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
