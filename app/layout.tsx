import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import 'rsuite/dist/rsuite-no-reset.min.css';
import '../src/rsuite-theme.css';
import { CustomProvider } from 'rsuite';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vitalix · Your health, together',
  description: 'Your personal health record. Track measurements, symptoms, and medications in one place.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body><CustomProvider>{children}</CustomProvider></body>
    </html>
  );
}
