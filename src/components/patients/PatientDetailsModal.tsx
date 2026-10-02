'use client';

import { useState } from 'react';
import { Modal } from 'rsuite';
import type { Patient } from '@/src/lib/patients';
import { PatientDetailsForm } from './PatientDetailsForm';

export function PatientDetailsModal({
  patient,
  onClose,
}: {
  patient?: Patient;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  return (
    <Modal
      open
      onClose={() => {
        if (!saving) onClose();
      }}
      size="xs"
    >
      <Modal.Header>
        <Modal.Title>{patient ? 'Edit patient' : 'Enroll patient'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <PatientDetailsForm
          patient={patient}
          onComplete={onClose}
          onCancel={onClose}
          onSavingChange={setSaving}
        />
      </Modal.Body>
    </Modal>
  );
}
