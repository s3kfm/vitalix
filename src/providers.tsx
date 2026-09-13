'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createDefaultFetcher } from 'react-query-fetcher';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { UserPlus } from 'lucide-react';
import { PatientProvider, usePatient } from './context/PatientContext';

// A fresh cache and component tree per patient also discard open forms and chats.
function PatientQueries({ children }: { children: ReactNode }) {
  const { patient } = usePatient();
  const [queryClient] = useState(() => {
    const scoped = createDefaultFetcher({ basePath: `/api/patients/${patient?.id}` });
    const catalogue = createDefaultFetcher({ basePath: '/api' });
    return new QueryClient({ defaultOptions: { queries: {
      queryFn: context => context.queryKey[0] === 'measurements' && context.queryKey[1] === 'definitions'
        ? catalogue(context) : scoped(context),
      staleTime: 60 * 1000,
      retry: 1,
    } } });
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
function PatientSession({ children }: { children: ReactNode }) {
  const { patient } = usePatient();
  return <PatientQueries key={patient?.id ?? 'no-patient'}>{children}</PatientQueries>;
}
export function PatientWorkspace({ children, quiet = false }: { children: ReactNode; quiet?: boolean }) {
  const { patient, loading, error, reload, setEnrollmentOpen } = usePatient();
  if (quiet && (loading || error || !patient)) return null;
  if (loading) return <p role="status">Loading patients…</p>;
  if (error) return <p role="alert">{error} <button onClick={reload}>Retry</button></p>;
  if (!patient) return (
    <section className="patient-welcome" aria-labelledby="patient-welcome-title">
      <span className="patient-welcome-icon"><UserPlus size={32} aria-hidden="true" /></span>
      <h1 id="patient-welcome-title">Your health record starts here</h1>
      <p>Enroll your first patient to keep measurements, medications, and symptoms together in one place.</p>
      <button className="button" onClick={() => setEnrollmentOpen(true)}><UserPlus size={18} aria-hidden="true" />Enroll your first patient</button>
      <small>Start with a name. Add health records whenever you’re ready.</small>
    </section>
  );
  return children;
}
export function Providers({ children }: { children: ReactNode }) {
  return <PatientProvider><PatientSession>{children}</PatientSession><Toaster richColors position="top-right" /></PatientProvider>;
}
