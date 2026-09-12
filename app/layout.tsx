import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import 'rsuite/dist/rsuite-no-reset.min.css';
import '../src/rsuite-theme.css';
import { CustomProvider } from 'rsuite';
import { Header } from '@/src/components/layout/Header';
import { AssistantBubble } from '@/src/components/assistant/AssistantBubble';
import { Providers, PatientWorkspace } from '@/src/providers';
import { HealthRecordsProvider } from '@/src/context/HealthRecordsContext';

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
        <CustomProvider>
          <Providers>
            <HealthRecordsProvider>
              <a className="skip-link" href="#main-content">Skip to content</a>
              <div className="app-shell">
                <Header />
                <div className="main-shell">
                  <main id="main-content"><PatientWorkspace>{children}</PatientWorkspace></main>
                  <footer>
                    <span>Vitalix · Your personal health record</span>
                    <span>Demo workspace</span>
                  </footer>
                </div>
              </div>
              <PatientWorkspace quiet><AssistantBubble /></PatientWorkspace>
            </HealthRecordsProvider>
          </Providers>
        </CustomProvider>
      </body>
    </html>
  );
}
