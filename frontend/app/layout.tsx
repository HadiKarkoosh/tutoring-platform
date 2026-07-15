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
      <body>
        <AuthProvider>
          <Navbar />
          <main className="container">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
