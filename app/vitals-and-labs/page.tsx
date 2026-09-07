'use client';

import { useVitalix } from '@/src/context/VitalixContext';
import { VitalsLabsPage } from '@/src/components/VitalsLabsPage';

export default function VitalsAndLabsRoute() {
  const {
    vitals,
    symptoms,
    handleResolveSymptom,
    setActiveModal,
    handleNavigateToIntake,
  } = useVitalix();

  return (
    <VitalsLabsPage
      vitals={vitals}
      symptoms={symptoms}
      onResolveSymptom={handleResolveSymptom}
      onOpenModal={setActiveModal}
      onNavigateToIntake={handleNavigateToIntake}
    />
  );
}