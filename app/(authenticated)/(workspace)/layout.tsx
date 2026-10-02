import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { currentUser } from '@/src/lib/auth/session';
import { listPatients } from '@/src/db/patient';
import { HealthRecordsProvider } from '@/src/context/HealthRecordsContext';
import { AssistantBubble } from '@/src/components/assistant/AssistantBubble';

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (!(await listPatients(user.id)).length) redirect('/enroll');
  return (
    <HealthRecordsProvider>
      {children}
      <AssistantBubble />
    </HealthRecordsProvider>
  );
}
