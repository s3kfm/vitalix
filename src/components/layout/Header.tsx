'use client';

import { useState, type ReactNode } from 'react';
import { Dropdown } from 'rsuite';
import { authClient } from '@/src/lib/auth/client';
import { toast } from 'sonner';
import { PatientDetailsModal } from '@/src/components/patients/PatientDetailsModal';
import type { Patient } from '@/src/lib/patients';
import { usePatient } from '@/src/context/PatientContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, LogOut, UserRound } from 'lucide-react';

interface NavigationItem {
  href: string;
  label: string;
}

const navigation: readonly NavigationItem[] = [
  { href: '/', label: 'Overview' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/vitals-and-labs', label: 'Measurements & Labs' },
  { href: '/symptoms', label: 'Symptoms' },
  { href: '/medications', label: 'Medications' },
  { href: '/ovulation', label: 'Cycle & ovulation' },
];

export function Header({ email, children }: { email: string; children?: ReactNode }) {
  const [loggingOut, setLoggingOut] = useState(false);
  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message || 'Could not log out.');
      window.location.assign('/login');
    } catch {
      toast.error('Could not log out. Please try again.');
      setLoggingOut(false);
    }
  }
  const { patients, patient, selectPatient, loading, error: loadError } = usePatient();
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const enrolling = pathname === '/enroll';

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Vitalix home">
          <span className="brand-icon">
            <Activity size={21} />
          </span>
          Vitalix
        </Link>
        {!enrolling && (
          <nav aria-label="Main navigation">
            {navigation.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? 'page' : undefined}
                className={pathname === href ? 'nav-link active' : 'nav-link'}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
        {!enrolling && (
          <Dropdown
            title={patient?.name ?? (loading ? 'Loading patients…' : 'Select patient')}
            placement="bottomEnd"
            disabled={loading || !!loadError}
            aria-label="Select patient"
          >
            {patients.map((item) => (
              <Dropdown.Item
                key={item.id}
                active={item.id === patient?.id}
                onSelect={() => selectPatient(item.id)}
              >
                {item.name}
              </Dropdown.Item>
            ))}
            {!!patients.length && <Dropdown.Item divider />}
            {patient && (
              <Dropdown.Item onSelect={() => setEditingPatient(patient)}>
                Edit patient
              </Dropdown.Item>
            )}
            <Dropdown.Item onSelect={() => router.push('/enroll')}>Enroll patient</Dropdown.Item>
          </Dropdown>
        )}
        {editingPatient && (
          <PatientDetailsModal
            key={editingPatient.id}
            patient={editingPatient}
            onClose={() => setEditingPatient(null)}
          />
        )}
        <Dropdown
          placement="bottomEnd"
          aria-label={`Account: ${email}`}
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <UserRound size={18} aria-hidden="true" />
              <span
                title={email}
                style={{
                  maxWidth: 180,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {email}
              </span>
            </span>
          }
        >
          <Dropdown.Item
            disabled={loggingOut}
            onSelect={() => {
              void logout();
            }}
            icon={<LogOut size={16} aria-hidden="true" />}
          >
            {loggingOut ? 'Logging out…' : 'Log out'}
          </Dropdown.Item>
        </Dropdown>
        {children}
      </div>
    </header>
  );
}
