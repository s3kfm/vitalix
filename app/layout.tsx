import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
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
        <ClerkProvider>
          <Providers>
            <HealthRecordsProvider>
              <a className="skip-link" href="#main-content">Skip to content</a>
              <div className="app-shell">
                <Header profile={demoProfile}>
                  <div className="flex items-center gap-2">
                    <Show when="signed-out">
                      <SignInButton mode="modal">
                        <button className="text-sm font-medium text-zinc-600 hover:text-zinc-900 cursor-pointer">
                          Sign In
                        </button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <button className="bg-zinc-900 text-white rounded-full font-medium text-sm h-9 px-4 cursor-pointer">
                          Sign Up
                        </button>
                      </SignUpButton>
                    </Show>
                    <Show when="signed-in">
                      <UserButton />
                    </Show>
                  </div>
                </Header>
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
        </ClerkProvider>
      </body>
    </html>
  );
}
