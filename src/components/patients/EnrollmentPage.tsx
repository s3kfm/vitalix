'use client';

import { ArrowLeft, ArrowRight, HeartPulse, UserPlus } from 'lucide-react';
import { Button, Panel } from 'rsuite';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { usePatient } from '@/src/context/PatientContext';
import { PatientDetailsForm } from './PatientDetailsForm';

export function EnrollmentPage() {
  const { patients } = usePatient();
  const router = useRouter();
  const firstPatient = patients.length === 0;
  return <section className="enrollment-page" aria-labelledby="enrollment-title">
    <Button appearance="subtle" startIcon={<ArrowLeft size={16} />} disabled={firstPatient}
      onClick={() => router.push('/')} aria-describedby={firstPatient ? 'enrollment-back-hint' : undefined}>Back</Button>
    <div className="enrollment-layout">
      <div className="enrollment-intro">
        <span className="enrollment-icon"><UserPlus size={28} aria-hidden="true" /></span>
        <p className="eyebrow">YOUR HEALTH, TOGETHER</p>
        <h1 id="enrollment-title">{firstPatient ? 'Enroll a Patient to get Started.' : 'Enroll a Patient'}</h1>
        <p>A little about them. A clearer picture of their health. Create a patient profile to bring their care into one place.</p>
        <div className="enrollment-note">
          <HeartPulse size={22} aria-hidden="true" />
          <div><strong>One profile. A connected health record.</strong><p>Keep measurements, medications, and symptoms together as their story grows.</p></div>
        </div>
        {firstPatient && <p id="enrollment-back-hint" className="enrollment-back-hint">Enroll your first patient to open your workspace.</p>}
      </div>
      <Panel bordered className="enrollment-card">
        <div className="enrollment-card-heading"><div><h2>Patient details</h2><p>Start with a name. You can update the details anytime.</p></div><ArrowRight size={20} aria-hidden="true" /></div>
        <PatientDetailsForm onComplete={() => {
          toast.success('Patient enrolled');
          router.replace('/');
          router.refresh();
        }} />
      </Panel>
    </div>
  </section>;
}
