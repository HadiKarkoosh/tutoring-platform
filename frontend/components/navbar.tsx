'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  function goToTutors(e: React.MouseEvent) {
    // Already on the listing — a Link to the same URL is a no-op, which
    // reads as "the button does nothing". Scroll back up instead.
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand">
          📚 منصة الدروس
        </Link>
        <div className="nav-links">
          <Link href="/" className="nav-link" onClick={goToTutors}>
            المدرّسون
          </Link>
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
