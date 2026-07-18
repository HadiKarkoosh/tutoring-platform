import type { Metadata } from 'next';
import { AuthProvider } from '../lib/auth-context';
import { LanguageProvider } from '../lib/i18n';
import Navbar from '../components/navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'منصة الدروس الخصوصية | Tutoring Platform',
  description: 'احجز درسك مع أفضل المدرّسين — Book your lesson with the best tutors',
};

// Runs before hydration so a saved English preference doesn't flash RTL first.
const setInitialDirScript = `
(function () {
  try {
    var lang = localStorage.getItem('lang');
    if (lang === 'en') {
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: setInitialDirScript }} />
      </head>
      <body>
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            <main className="container">{children}</main>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
