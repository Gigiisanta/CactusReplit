import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { ClientLayoutWrapper } from '@/components/layout/client-layout-wrapper';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Cactus Wealth Dashboard',
  description:
    'Professional wealth management dashboard for financial advisors',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <AuthProvider>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
