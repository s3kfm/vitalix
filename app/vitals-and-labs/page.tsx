import { VitalsLabsPage } from '@/src/components/VitalsLabsPage';
import { initialVitals, initialSymptoms } from '@/src/data/initialData';

export default function Page() {
  return <VitalsLabsPage vitals={initialVitals} symptoms={initialSymptoms} />;
}
