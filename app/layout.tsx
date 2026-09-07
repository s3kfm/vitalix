import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from '@/src/components/Header';
import { Footer } from '@/src/components/Footer';
import { Providers } from '@/src/providers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vitalix",
  description: "Vitalix Health Portal - Clinical Systems",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <div className="min-h-screen flex flex-col bg-[#fcf9f5] text-[#3a3530]">
            <Header />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
