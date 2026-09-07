'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, Sparkles } from 'lucide-react';

interface HeaderProps {
  unreadCount?: number;
}

interface TabDef {
  label: string;
  href: string;
  path: string;
  icon?: boolean;
  mdOnly?: boolean;
}

const tabs: TabDef[] = [
  { label: 'Overview', href: '/', path: '/' },
  { label: 'Vitals & Labs', href: '/vitals-and-labs', path: '/vitals-and-labs' },
  { label: 'Medications', href: '/medications', path: '/medications' },
  { label: 'AI Health Chat', href: '/ai-intake', path: '/ai-intake', icon: true, mdOnly: true },
];

export const Header: React.FC<HeaderProps> = ({
  unreadCount = 1
}) => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#f4f1eb]/95 backdrop-blur-md border-b border-[#e8e4db] shadow-[0_1px_6px_rgba(58,53,48,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Global Search */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-left group focus:outline-none"
            title="Vitalix Home"
          >
            <div className="w-8 h-8 rounded-lg bg-[#5a6344] flex items-center justify-center text-white shadow-xs group-hover:bg-[#4a5237] transition-colors font-bold">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span className="font-serif-display text-2xl font-medium tracking-tight text-[#3a3530]">
              Vitalix
            </span>
          </Link>

          {/* Quick Search */}
          <div className="hidden xl:flex items-center relative">
            <Search className="w-4 h-4 absolute left-3 text-[#7a7267] pointer-events-none" />
            <input
              type="text"
              readOnly
              aria-disabled="true"
              placeholder="Search vitals, symptoms, meds..."
              className="w-72 h-9 pl-9 pr-14 bg-[#fcf9f5] hover:bg-white border border-[#e8e4db] rounded-xl text-xs text-[#3a3530] placeholder:text-[#7a7267] focus:outline-none focus:border-[#5a6344] transition-all cursor-pointer shadow-2xs"
            />
            <div
              aria-disabled="true"
              className="absolute right-2 flex items-center px-1.5 py-0.5 bg-[#f4f1eb] rounded border border-[#e8e4db] text-[10px] font-mono-data text-[#7a7267] cursor-pointer shadow-2xs"
            >
              ⌘K
            </div>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {tabs.map((tab) => {
            const isActive = tab.path === '/'
              ? pathname === '/'
              : pathname.startsWith(tab.path);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`${tab.mdOnly ? 'hidden md:flex' : ''} ${tab.icon ? 'items-center gap-1.5' : ''} px-3.5 py-2 text-xs sm:text-sm rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-[#5a6344] text-white shadow-xs font-semibold'
                    : tab.icon
                      ? 'text-[#7a7267] hover:text-[#5a6344] hover:bg-[#e8e4db]/50'
                      : 'text-[#7a7267] hover:text-[#3a3530] hover:bg-[#e8e4db]/50'
                }`}
                title={tab.icon ? 'Interactive AI Intake & Health Chat' : undefined}
              >
                {tab.icon && (
                  <Sparkles className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#5a6344]'}`} />
                )}
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Notifications & Patient Profile */}
        <div className="flex items-center gap-3">
          <button
            aria-disabled="true"
            className="relative p-2 rounded-xl text-[#7a7267] hover:bg-[#e8e4db]/50 hover:text-[#3a3530] transition-colors"
            title="Notifications"
            type="button"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#b44c3c] ring-2 ring-[#f4f1eb]" />
            )}
          </button>

          <div className="h-6 w-px bg-[#e8e4db] hidden sm:block" />

          {/* User Profile Card */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="relative shrink-0">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                alt="Jane Doe Profile"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#dfd3c3] shadow-2xs"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#5a6344] ring-2 ring-[#f4f1eb]" />
            </div>
            <div className="hidden md:flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-xs text-[#3a3530] leading-tight">
                  Jane Doe
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full font-mono-data text-[10px] uppercase tracking-wider bg-[#e8e4db] text-[#5a6344] font-semibold border border-[#dfd3c3]">
                  Optimal
                </span>
              </div>
              <span className="font-mono-data text-[10px] text-[#7a7267]">
                Age: 28 | DOB: May 14, 1998
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
