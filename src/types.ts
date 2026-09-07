export type PageTab = 'overview' | 'vitals-and-labs' | 'medications' | 'ai-intake';

export interface VitalsData {
  systolic: number;
  diastolic: number;
  heartRate: number;
  bpStatus: string;
  bpDelta: string;
  restingHeartRate: number;
  fastingGlucose: number;
  fastingGlucoseStatus: string;
  fastingGlucoseTime: string;
  nonFastingGlucose: number;
  nonFastingGlucoseStatus: string;
  weight: number;
  weightDelta: string;
  height: string;
  bmi: number;
  targetWeight: number;
  targetProgressPercent: number;
  bodyFatPercent: number;
  leanMuscleMass: number;
  muscleDelta: string;
}

export interface CycleData {
  cycleDay: number;
  phase: string;
  lengthDays: number;
  regularity: string;
  flow: 'Light' | 'Medium' | 'Heavy' | 'Spotting';
  status: string;
  symptoms: string[];
}

export interface Diagnosis {
  id: string;
  name: string;
  tag: string;
  tagColor: 'tertiary' | 'primary' | 'secondary' | 'error';
  details: string;
  icon: string;
  status: 'active' | 'healing' | 'monitoring';
}

export interface Prescription {
  id: string;
  name: string;
  type: 'maintenance' | 'acute' | 'prn';
  dosage: string;
  form?: string;
  categoryBadge?: string;
  instructions: string;
  scheduleTimes: string[];
  prescriber: string;
  prescriberSpecialty: string;
  pillsLeft?: number;
  totalPills?: number;
  refillDueText?: string;
  supplyDaysText?: string;
  pillSupplyStatus?: 'healthy' | 'warning' | 'alert';
  currentDay?: number;
  totalDays?: number;
  progressPercent?: number;
  daysRemainingText?: string;
  targetCompletionDate?: string;
  usageTodayText?: string;
  maxDailyLimitText?: string;
  status: 'active' | 'paused';
}

export interface ArchivedPrescription {
  id: string;
  name: string;
  type: string;
  started: string;
  ended: string;
  notes: string;
  prescriber: string;
  status: 'completed' | 'discontinued';
}

export interface Symptom {
  id: string;
  title: string;
  severity: number;
  severityMax: number;
  severityLabel: string;
  location: string;
  onset: string;
  status: 'active' | 'resolved';
  description: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface HealthLogItem {
  id: string;
  category: 'vitals' | 'symptoms' | 'labs' | 'cycle' | 'medication';
  title: string;
  badge: string;
  badgeType: 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan' | 'slate';
  description: string;
  timestamp: string;
}

export interface Biomarker {
  id: string;
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  category: string;
  status: 'optimal' | 'normal' | 'elevated' | 'low';
}
