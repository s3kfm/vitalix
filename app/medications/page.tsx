'use client';

import { useVitalix } from '@/src/context/VitalixContext';
import { MedicationsPage } from '@/src/components/MedicationsPage';

export default function MedicationsRoute() {
  const {
    prescriptions,
    archivedPrescriptions,
    setActiveModal,
    handleNavigateToIntake,
  } = useVitalix();

  return (
    <MedicationsPage
      prescriptions={prescriptions}
      archivedPrescriptions={archivedPrescriptions}
      onOpenModal={setActiveModal}
      onNavigateToIntake={handleNavigateToIntake}
    />
  );
}