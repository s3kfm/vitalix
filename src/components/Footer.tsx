'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Footer: React.FC = () => {
  const pathname = usePathname();

  const getSubtext = () => {
    if (pathname.startsWith('/vitals-and-labs') || pathname.startsWith('/medications'))
      return 'Vitalix Clinical Telemetry Engine • v3.2.0-PROD';
    if (pathname.startsWith('/ai-intake'))
      return 'Vitalix Health Assistant • v3.2';
    return 'Vitalix Health Portal • Clinical Systems';
  };

  return (
    <footer className="w-full border-t border-[#e8e4db] bg-[#fcf9f5] py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#7d756d]">
        <div className="flex items-center gap-2">
          <span className="font-headline font-bold text-[#5a6344]">
            {getSubtext()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <Link
            href="/vitals-and-labs"
            className="hover:text-[#3a3530] transition-colors"
          >
            Medical Records
          </Link>
          <Link
            href="/"
            className="hover:text-[#3a3530] transition-colors"
          >
            Compliance & HIPAA
          </Link>
          <span className="font-mono-data text-[#a89f91]">
            © 2024 Vitalix Health Systems. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};
