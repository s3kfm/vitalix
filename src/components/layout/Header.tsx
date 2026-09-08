'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity } from 'lucide-react';
import type { UserProfile } from '../../types';

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

export function Header({ profile, children }: { profile: UserProfile; children?: ReactNode }) {
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
        <div className="profile">
          <span className="avatar" aria-hidden="true">{profile.initials}</span>
          <div>
            <strong>{profile.displayName}</strong>
            <small>Personal health record</small>
          </div>
        </div>
        {children}
      </div>
    </header>
  );
}
