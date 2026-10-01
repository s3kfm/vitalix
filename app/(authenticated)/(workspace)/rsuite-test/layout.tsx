import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

/** The theme playground is for development only; production answers 404. */
export default function RsuiteTestLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'production') notFound();
  return children;
}
