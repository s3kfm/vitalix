import { OverviewPage } from '@/src/components/OverviewPage';
import { initialVitals, initialCycle, initialDiagnoses, initialLogs } from '@/src/data/initialData';

export default function Page() {
  return <OverviewPage vitals={initialVitals} cycle={initialCycle} diagnoses={initialDiagnoses} logs={initialLogs} />;
}
