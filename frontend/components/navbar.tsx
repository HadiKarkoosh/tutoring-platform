'use client';

import { useState } from 'react';
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
  openMenu: { ar: 'فتح القائمة', en: 'Open menu' },
};

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { toggle } = useLang();
  const t = useT(TEXT);
  const [open, setOpen] = useState(false);

  function goToTutors() {
    // A Link to "/" is a no-op when already on "/" — no navigation event
    // fires, so nothing visibly happens. Always force a real transition:
    // navigate first (harmless if already there), then scroll to the
    // listing regardless of which page we started from.
    setOpen(false);
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

        <button
          type="button"
          className="nav-toggle"
          aria-label={t.openMenu}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-links ${open ? 'is-open' : ''}`}>
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
                onClick={() => setOpen(false)}
              >
                {t.dashboard}
              </Link>
              <span className="badge badge-muted">{user.name}</span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setOpen(false);
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
              <Link href="/login" className="nav-link" onClick={() => setOpen(false)}>
                {t.login}
              </Link>
              <Link href="/register" className="btn btn-sm" onClick={() => setOpen(false)}>
                {t.register}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
