'use client';

import { useState } from 'react';
import { Modal } from '../Modals';
import { MeasurementForm } from './MeasurementForm';

export function MeasurementModal({ onClose }: { onClose: () => void }) {
  const [pending, setPending] = useState(false);
  return <Modal title="Add a measurement" onClose={() => { if (!pending) onClose(); }}>
    <MeasurementForm onSuccess={onClose} onCancel={onClose} onPendingChange={setPending} />
  </Modal>;
}
