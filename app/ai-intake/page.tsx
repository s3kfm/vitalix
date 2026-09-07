'use client';

import { useVitalix } from '@/src/context/VitalixContext';
import { AiIntakePage } from '@/src/components/AiIntakePage';

export default function AiIntakeRoute() {
  const {
    handleConfirmExtractedRecords,
    intakePrefill,
    intakeAutoStage,
  } = useVitalix();

  return (
    <AiIntakePage
      onConfirmExtractedRecords={handleConfirmExtractedRecords}
      prefilledPrompt={intakePrefill}
      autoStaged={intakeAutoStage}
    />
  );
}