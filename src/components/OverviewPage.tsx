'use client';
import { useState } from 'react';
import { demoProfile } from '../data/initialData';
import Link from 'next/link';
import { Activity, HeartPulse, Pill, FileUp, ArrowUpRight } from 'lucide-react';
import { PageHeading } from './ui/PageHeading';
import { DashboardTimeline } from './timeline/DashboardTimeline';
import { PinnedMeasurements } from './records/PinnedMeasurements';
import { TodayMedications } from './medications/TodayMedications';
import { MeasurementModal } from './records/MeasurementModal';
import { SymptomLogModal } from './symptoms/SymptomLogModal';
import { UploadReportModal } from './records/UploadReportModal';
export function OverviewPage() {
  const [modal, setModal] = useState<'measurement' | 'symptom' | 'report' | null>(null);
  return <div className="page-stack"><PageHeading eyebrow="YOUR EVERYDAY HEALTH" title="A little more in the know." description={`Welcome back, ${demoProfile.firstName}. Here’s your health, in one place.`} />
    <section className="quick-log">
      <div>
        <span className="eyebrow">MAKE A NOTE OF IT</span><h2>What would you like to record?</h2><p>A reading, a feeling, or a part of your routine.</p></div><div className="quick-actions"><button onClick={() => setModal('measurement')}><Activity size={22} /><span>Measurement</span></button><button onClick={() => setModal('symptom')}><HeartPulse size={22} /><span>Symptom</span></button><Link href="/medications"><Pill size={22} /><span>Medication dose</span></Link><button onClick={() => setModal('report')}><FileUp size={22} /><span>Health report</span></button></div></section>{/* <PinnedMeasurements/> */}<div className="overview-columns"><DashboardTimeline /><div className="overview-aside"><section className="panel"><div className="panel-title"><div><h2>Today’s medications</h2><p>A moment for your routine.</p></div><Link href="/medications" aria-label="View medications" className="text-button"><ArrowUpRight size={20} /></Link></div><TodayMedications /></section><div className="gentle-note"><span>Made for your everyday.</span><p>You don’t need to track everything. Start with what matters to you.</p></div></div></div><MeasurementModal open={modal === 'measurement'} onClose={() => setModal(null)} />{modal === 'symptom' && <SymptomLogModal onClose={() => setModal(null)} />}{modal === 'report' && <UploadReportModal onClose={() => setModal(null)} />}</div>;
}
