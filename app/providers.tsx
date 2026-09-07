'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { VitalixProvider, useVitalix } from '@/src/context/VitalixContext';
import { Header } from '@/src/components/Header';
import { Footer } from '@/src/components/Footer';
import { Modals } from '@/src/components/Modals';
import type { PageTab } from '@/src/types';

const tabToPath: Record<PageTab, string> = {
  overview: '/',
  'vitals-and-labs': '/vitals-and-labs',
  medications: '/medications',
  'ai-intake': '/ai-intake',
};

const pathToTab: Record<string, PageTab> = {
  '/': 'overview',
  '/vitals-and-labs': 'vitals-and-labs',
  '/medications': 'medications',
  '/ai-intake': 'ai-intake',
};

function LayoutShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentTab,
    setCurrentTab,
    activeModal,
    setActiveModal,
    vitals,
    handleUpdateVitals,
    handleAddSymptom,
    handleAddLog,
    prescriptions,
    handleRefillPrescription,
    handleAddPrescription,
  } = useVitalix();

  return (
    <div className="min-h-screen flex flex-col bg-[#fcf9f5] text-[#3a3530]">
      <Header
        onOpenSearch={() => setActiveModal('search')}
        onOpenNotifications={() => setActiveModal('notifications')}
        unreadCount={1}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12">
        {children}
      </main>

      <Modals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        vitals={vitals}
        onUpdateVitals={handleUpdateVitals}
        onAddSymptom={handleAddSymptom}
        onAddLog={handleAddLog}
        prescriptions={prescriptions}
        onRefillPrescription={handleRefillPrescription}
        onAddPrescription={handleAddPrescription}
      />

      <Footer />
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <VitalixProvider>
      <LayoutShell>{children}</LayoutShell>
    </VitalixProvider>
  );
}