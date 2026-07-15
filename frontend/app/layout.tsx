import type { Metadata } from 'next';
import { AuthProvider } from '../lib/auth-context';
import Navbar from '../components/navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'منصة الدروس الخصوصية',
  description: 'احجز درسك مع أفضل المدرّسين',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <main className="container">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
