'use client';

import { useState, type ReactNode, type FormEvent } from 'react';
import { Dropdown, Modal, Button, Input } from 'rsuite';
import { usePatient } from '@/src/context/PatientContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity } from 'lucide-react';


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
];

export function Header({ children }: { children?: ReactNode }) {
  const { patients, patient, selectPatient, enrollPatient, loading, error: loadError } = usePatient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function enroll(event: FormEvent) {
    event.preventDefault();
    if (saving || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await enrollPatient(name.trim());
      setOpen(false);
      setName('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not enroll patient.');
    } finally { setSaving(false); }
  }
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Vitalix home">
          <span className="brand-icon"><Activity size={21} /></span>
          Vitalix
        </Link>
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
        <Dropdown title={patient?.name ?? (loading ? 'Loading patients…' : 'Select patient')} placement="bottomEnd" disabled={loading || !!loadError} aria-label="Select patient">
          {patients.map(item => <Dropdown.Item key={item.id} active={item.id === patient?.id} onSelect={() => selectPatient(item.id)}>{item.name}</Dropdown.Item>)}
          {!!patients.length && <Dropdown.Item divider />}
          <Dropdown.Item onSelect={() => { setName(''); setError(null); setOpen(true); }}>Enroll patient</Dropdown.Item>
        </Dropdown>
        <Modal open={open} onClose={() => { if (!saving) setOpen(false); }} size="xs">
          <Modal.Header><Modal.Title>Enroll patient</Modal.Title></Modal.Header>
          <form onSubmit={enroll}>
            <Modal.Body>
              <label htmlFor="patient-name">Patient name</label>
              <Input id="patient-name" value={name} onChange={setName} maxLength={200} autoFocus disabled={saving} />
              {error && <p role="alert">{error}</p>}
            </Modal.Body>
            <Modal.Footer>
              <Button appearance="subtle" disabled={saving} onClick={() => setOpen(false)}>Cancel</Button>
              <Button appearance="primary" type="submit" loading={saving} disabled={!name.trim()}>Enroll patient</Button>
            </Modal.Footer>
          </form>
        </Modal>
        {children}
      </div>
    </header>
  );
}
