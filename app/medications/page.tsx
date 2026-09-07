import { MedicationsPage } from '@/src/components/MedicationsPage';
import { initialPrescriptions, initialArchivedPrescriptions } from '@/src/data/initialData';

export default function Page() {
  return <MedicationsPage prescriptions={initialPrescriptions} archivedPrescriptions={initialArchivedPrescriptions} />;
}
