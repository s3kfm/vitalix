import {
  VitalsData,
  CycleData,
  Diagnosis,
  Prescription,
  ArchivedPrescription,
  Symptom,
  HealthLogItem,
  Biomarker
} from '../types';

export const initialVitals: VitalsData = {
  systolic: 120,
  diastolic: 80,
  heartRate: 68,
  bpStatus: 'Optimal',
  bpDelta: '2% Stable',
  restingHeartRate: 68,
  fastingGlucose: 135,
  fastingGlucoseStatus: '+14% Elevated',
  fastingGlucoseTime: '07:45 AM',
  nonFastingGlucose: 124,
  nonFastingGlucoseStatus: 'In Target',
  weight: 172.5,
  weightDelta: '-1.5 lbs',
  height: `5'7"`,
  bmi: 27.0,
  targetWeight: 160,
  targetProgressPercent: 54,
  bodyFatPercent: 23.4,
  leanMuscleMass: 101.2,
  muscleDelta: '+0.4 lbs muscle retention'
};

export const initialCycle: CycleData = {
  cycleDay: 14,
  phase: 'Ovulation',
  lengthDays: 28,
  regularity: 'Regular',
  flow: 'Medium',
  status: 'Ovulation Peak',
  symptoms: ['Mild pelvic cramping']
};

export const initialDiagnoses: Diagnosis[] = [
  {
    id: 'diag-1',
    name: 'Asthma',
    tag: 'Chronic',
    tagColor: 'tertiary',
    details: 'Inhaler PRN, Last flare 3 mo ago',
    icon: 'check_circle',
    status: 'active'
  },
  {
    id: 'diag-2',
    name: 'Right Ankle Sprain',
    tag: 'Healing',
    tagColor: 'primary',
    details: 'Physical therapy 2x/wk, Day 12 of recovery',
    icon: 'healing',
    status: 'healing'
  },
  {
    id: 'diag-3',
    name: 'Headache (Severity 4/10)',
    tag: 'Logged 2:15 PM',
    tagColor: 'error',
    details: 'Frontal tension, hydrated with 500ml water',
    icon: 'warning',
    status: 'active'
  }
];

export const initialPrescriptions: Prescription[] = [
  {
    id: 'rx-1',
    name: 'Metformin 500mg',
    type: 'maintenance',
    dosage: '500mg',
    form: 'Tablet',
    instructions: '1 tablet, twice daily with meals',
    scheduleTimes: ['8:00 AM', '8:00 PM'],
    prescriber: 'Dr. Aris Thorne',
    prescriberSpecialty: 'Primary Care • Memorial Clinic',
    pillsLeft: 24,
    totalPills: 90,
    refillDueText: 'Refill due Sep 18',
    supplyDaysText: '24 pills left',
    pillSupplyStatus: 'alert',
    status: 'active'
  },
  {
    id: 'rx-2',
    name: 'Lisinopril 10mg',
    type: 'maintenance',
    dosage: '10mg',
    form: 'Tablet',
    instructions: '1 tablet, every morning',
    scheduleTimes: ['8:00 AM'],
    prescriber: 'Dr. Aris Thorne',
    prescriberSpecialty: 'Primary Care • Memorial Clinic',
    pillsLeft: 45,
    totalPills: 60,
    refillDueText: 'Healthy Supply (45d)',
    supplyDaysText: '45 pills left',
    pillSupplyStatus: 'healthy',
    status: 'active'
  },
  {
    id: 'rx-3',
    name: 'Amoxicillin 500mg',
    type: 'acute',
    dosage: '500mg',
    form: 'Capsule',
    categoryBadge: 'Temporary (Antibiotic)',
    instructions: '1 capsule, 3x daily',
    scheduleTimes: ['Breakfast', 'Lunch', 'Dinner'],
    prescriber: 'Dr. Clara Vance',
    prescriberSpecialty: 'Urgent Care • City Health',
    currentDay: 4,
    totalDays: 7,
    progressPercent: 57,
    daysRemainingText: 'Ends Sep 5 • 3 days remaining',
    targetCompletionDate: 'Sep 5',
    status: 'active'
  },
  {
    id: 'rx-4',
    name: 'Albuterol Sulfate Inhaler 90mcg',
    type: 'prn',
    dosage: '90mcg/actuation',
    instructions: '2 puffs as needed for shortness of breath or wheezing',
    scheduleTimes: ['As needed'],
    prescriber: 'Dr. Clara Vance',
    prescriberSpecialty: 'Pulmonology',
    usageTodayText: 'Used 1x today (10:15 AM)',
    maxDailyLimitText: 'Max 8 puffs / 24h',
    status: 'active'
  },
  {
    id: 'rx-5',
    name: 'Ibuprofen 400mg',
    type: 'prn',
    dosage: '400mg',
    instructions: '1 tablet as needed for severe headache or joint pain',
    scheduleTimes: ['As needed'],
    prescriber: 'Dr. Aris Thorne',
    prescriberSpecialty: 'Primary Care',
    usageTodayText: 'Not used today',
    maxDailyLimitText: 'Max 1,200mg/24h with food',
    status: 'active'
  }
];

export const initialArchivedPrescriptions: ArchivedPrescription[] = [
  {
    id: 'arch-1',
    name: 'Prednisone 10mg',
    type: 'Temporary (Corticosteroid)',
    started: 'Jul 10, 2026',
    ended: 'Jul 20, 2026',
    notes: '10-day taper for Sinus Infection',
    prescriber: 'Dr. Aris Thorne',
    status: 'completed'
  },
  {
    id: 'arch-2',
    name: 'Azithromycin 250mg',
    type: 'Temporary (Z-Pak)',
    started: 'Mar 12, 2026',
    ended: 'Mar 17, 2026',
    notes: '5-day course for Bronchitis',
    prescriber: 'Dr. Clara Vance',
    status: 'completed'
  },
  {
    id: 'arch-3',
    name: 'Ciprofloxacin 500mg',
    type: 'Antibiotic',
    started: 'Jan 04, 2026',
    ended: 'Jan 07, 2026',
    notes: 'Discontinued due to mild gastrointestinal upset',
    prescriber: 'Dr. Aris Thorne',
    status: 'discontinued'
  }
];

export const initialSymptoms: Symptom[] = [
  {
    id: 'sym-1',
    title: 'Mild Tension Headache',
    severity: 3,
    severityMax: 10,
    severityLabel: 'Mild',
    location: 'Frontal / Bilateral',
    onset: 'Today 11:00 AM',
    status: 'active',
    description: 'Mild throbbing at temples after screen time. Hydrated with 500ml water.'
  },
  {
    id: 'sym-2',
    title: 'Lower Back Stiffness',
    severity: 2,
    severityMax: 10,
    severityLabel: 'Mild',
    location: 'Lumbar Region',
    onset: '2 days ago',
    status: 'active',
    description: 'Stiffness noted after seated desk work, improves with walking.'
  },
  {
    id: 'sym-3',
    title: 'Sinus Pressure & Nasal Congestion',
    severity: 4,
    severityMax: 10,
    severityLabel: 'Moderate',
    location: 'Facial / Sinuses',
    onset: 'Sep 07, 2024',
    status: 'resolved',
    description: 'Onset Sep 07 • Duration: 5 days',
    resolvedAt: 'Sep 12, 2024',
    resolvedBy: 'Jane Doe'
  },
  {
    id: 'sym-4',
    title: 'Occasional Nausea',
    severity: 2,
    severityMax: 10,
    severityLabel: 'Mild',
    location: 'Abdominal',
    onset: 'Aug 26, 2024',
    status: 'resolved',
    description: 'Onset Aug 26 • Duration: 2 days',
    resolvedAt: 'Aug 28, 2024',
    resolvedBy: 'Jane Doe'
  }
];

export const initialLogs: HealthLogItem[] = [
  {
    id: 'log-1',
    category: 'symptoms',
    title: 'Symptom Logged: Headache',
    badge: 'Severity 4/10',
    badgeType: 'rose',
    description: 'Mild throbbing at temples after screen time.',
    timestamp: 'Today, 2:15 PM'
  },
  {
    id: 'log-2',
    category: 'labs',
    title: 'Lab Result Uploaded: Fasting Glucose (135 mg/dL)',
    badge: 'Elevated',
    badgeType: 'rose',
    description: 'Verified synchronization from LabCorp Diagnostic Engine.',
    timestamp: 'Today, 7:45 AM'
  },
  {
    id: 'log-3',
    category: 'medication',
    title: 'Medication Logged: Metformin 500mg',
    badge: 'Adherence 100%',
    badgeType: 'emerald',
    description: 'Taken with breakfast meal.',
    timestamp: 'Today, 8:12 AM'
  },
  {
    id: 'log-4',
    category: 'cycle',
    title: 'Period Logged: Cycle Day 14',
    badge: 'Medium Flow',
    badgeType: 'indigo',
    description: 'Mild pelvic cramping reported. Normal cycle progression.',
    timestamp: 'Yesterday, 9:30 PM'
  },
  {
    id: 'log-5',
    category: 'vitals',
    title: 'Vitals Synced: Blood Pressure 120/80 mmHg',
    badge: 'Withings BPM',
    badgeType: 'cyan',
    description: 'Automatic Bluetooth telemetry sync. Status normotensive.',
    timestamp: 'Yesterday, 8:00 AM'
  }
];

export const initialBiomarkers: Biomarker[] = [
  {
    id: 'bm-1',
    name: 'Fasting Blood Sugar',
    value: '135',
    unit: 'mg/dL',
    referenceRange: '70 – 99 mg/dL',
    category: 'Glucose / Metabolic',
    status: 'elevated'
  },
  {
    id: 'bm-2',
    name: 'HbA1c (Glycated Hemoglobin)',
    value: '5.8',
    unit: '%',
    referenceRange: '< 5.7%',
    category: 'Optimal Glycemic Control',
    status: 'normal'
  },
  {
    id: 'bm-3',
    name: 'Vitamin D (25-Hydroxy)',
    value: '32',
    unit: 'ng/mL',
    referenceRange: '30 – 100 ng/mL',
    category: 'Immuno-Endocrine',
    status: 'optimal'
  }
];
