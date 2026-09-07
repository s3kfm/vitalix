import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/src/components/layout/Header';
import { AssistantBubble } from '@/src/components/assistant/AssistantBubble';
import { Providers } from '@/src/providers';
import { HealthRecordsProvider } from '@/src/context/HealthRecordsContext';
import { demoProfile } from '@/src/data/initialData';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vitalix · Your health, together',
  description: 'Your personal health record. Track measurements, symptoms, and medications in one place.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Providers>
          <HealthRecordsProvider>
            <a className="skip-link" href="#main-content">Skip to content</a>
            <div className="app-shell">
              <Header profile={demoProfile} />
              <div className="main-shell">
                <main id="main-content">{children}</main>
                <footer>
                  <span>Vitalix · Your personal health record</span>
                  <span>Demo workspace · Changes reset on refresh</span>
                </footer>
              </div>
            </div>
            <AssistantBubble />
          </HealthRecordsProvider>
        </Providers>
      </body>
    </html>
  );
}
