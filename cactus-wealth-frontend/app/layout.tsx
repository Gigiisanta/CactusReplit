import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { ClientRoot } from '@/components/ClientRoot';

export const metadata: Metadata = {
  title: 'Cactus Wealth Dashboard',
  description: 'Professional financial advisor dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className='antialiased'>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
