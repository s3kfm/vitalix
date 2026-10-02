'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createDefaultFetcher } from 'react-query-fetcher';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import type { Patient } from './lib/patients';
import { PatientProvider, usePatient } from './context/PatientContext';

// A fresh cache and component tree per patient also discard open forms and chats.
function PatientQueries({ children }: { children: ReactNode }) {
  const { patient } = usePatient();
  const [queryClient] = useState(() => {
    const scoped = createDefaultFetcher({ basePath: `/api/patients/${patient?.id}` });
    const catalogue = createDefaultFetcher({ basePath: '/api' });
    return new QueryClient({
      defaultOptions: {
        queries: {
          queryFn: (context) =>
            context.queryKey[0] === 'measurements' && context.queryKey[1] === 'definitions'
              ? catalogue(context)
              : scoped(context),
          staleTime: 60 * 1000,
          retry: 1,
        },
      },
    });
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
function PatientSession({ children }: { children: ReactNode }) {
  const { patient } = usePatient();
  return <PatientQueries key={patient?.id ?? 'no-patient'}>{children}</PatientQueries>;
}
export function Providers({
  children,
  initialPatients,
}: {
  children: ReactNode;
  initialPatients: Patient[];
}) {
  return (
    <PatientProvider initialPatients={initialPatients}>
      <PatientSession>{children}</PatientSession>
      <Toaster richColors position="top-right" />
    </PatientProvider>
  );
}
