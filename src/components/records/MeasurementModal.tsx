'use client';

import { useState } from 'react';
import { Modal } from 'rsuite';
import { MeasurementForm } from './MeasurementForm';

export function MeasurementModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pending, setPending] = useState(false);
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!pending) onClose();
      }}
      size="md"
    >
      <Modal.Header>
        <Modal.Title>Add a measurement</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <MeasurementForm onSuccess={onClose} onCancel={onClose} onPendingChange={setPending} />
      </Modal.Body>
    </Modal>
  );
}
