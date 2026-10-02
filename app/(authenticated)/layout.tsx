import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { currentUser } from '@/src/lib/auth/session';
import { listPatients } from '@/src/db/patient';
import { Providers } from '@/src/providers';
import { Header } from '@/src/components/layout/Header';

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user) redirect('/login');
  const patients = await listPatients(user.id);
  return (
    <Providers initialPatients={patients}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="app-shell">
        <Header email={user.email} />
        <div className="main-shell">
          <main id="main-content">{children}</main>
          <footer>
            <span>Vitalix · Your personal health record</span>
            <span>Your health, together</span>
          </footer>
        </div>
      </div>
    </Providers>
  );
}
