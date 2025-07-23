import localFont from 'next/font/local';

export const geistSans = localFont({
  src: '/fonts/GeistVF.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
});

export const geistMono = localFont({
  src: '/fonts/GeistMonoVF.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
});
