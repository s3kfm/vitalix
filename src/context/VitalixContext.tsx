'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  PageTab,
  VitalsData,
  CycleData,
  Diagnosis,
  Prescription,
  ArchivedPrescription,
  Symptom,
  HealthLogItem,
  Biomarker
} from '../types';
import {
  initialVitals,
  initialCycle,
  initialDiagnoses,
  initialPrescriptions,
  initialArchivedPrescriptions,
  initialSymptoms,
  initialLogs
} from '../data/initialData';

export interface VitalixContextType {
  currentTab: PageTab;
  setCurrentTab: (tab: PageTab) => void;
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  vitals: VitalsData;
  cycle: CycleData;
  diagnoses: Diagnosis[];
  prescriptions: Prescription[];
  archivedPrescriptions: ArchivedPrescription[];
  symptoms: Symptom[];
  logs: HealthLogItem[];
  intakePrefill: string;
  intakeAutoStage: boolean;
  handleNavigateToIntake: (prefilledText?: string, autoStage?: boolean) => void;
  handleUpdateVitals: (newVitals: Partial<VitalsData>) => void;
  handleAddSymptom: (newSymptom: Omit<Symptom, 'id'>) => void;
  handleResolveSymptom: (id: string) => void;
  handleAddLog: (newLog: Omit<HealthLogItem, 'id'>) => void;
  handleRefillPrescription: (id: string) => void;
  handleAddPrescription: (rx: Omit<Prescription, 'id'>) => void;
  handleConfirmExtractedRecords: (data: {
    biomarkers: Biomarker[];
    symptom: { title: string; severity: number; location: string; notes: string };
    cycle: { flow: 'Medium'; day: number };
  }) => void;
}

const VitalixContext = createContext<VitalixContextType | undefined>(undefined);

export const VitalixProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<PageTab>('overview');
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const [vitals, setVitals] = useState<VitalsData>(initialVitals);
  const [cycle, setCycle] = useState<CycleData>(initialCycle);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>(initialDiagnoses);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [archivedPrescriptions, setArchivedPrescriptions] = useState<ArchivedPrescription[]>(initialArchivedPrescriptions);
  const [symptoms, setSymptoms] = useState<Symptom[]>(initialSymptoms);
  const [logs, setLogs] = useState<HealthLogItem[]>(initialLogs);

  const [intakePrefill, setIntakePrefill] = useState<string>('');
  const [intakeAutoStage, setIntakeAutoStage] = useState<boolean>(false);

  const handleNavigateToIntake = useCallback((prefilledText?: string, autoStage?: boolean) => {
    setIntakePrefill(prefilledText || '');
    setIntakeAutoStage(!!autoStage);
    setCurrentTab('ai-intake');
  }, []);

  const handleUpdateVitals = useCallback((newVitals: Partial<VitalsData>) => {
    setVitals((prev) => ({ ...prev, ...newVitals }));
  }, []);

  const handleAddSymptom = useCallback((newSymptom: Omit<Symptom, 'id'>) => {
    const created: Symptom = { ...newSymptom, id: `sym-${Date.now()}` };
    setSymptoms((prev) => [created, ...prev]);
  }, []);

  const handleAddLog = useCallback((newLog: Omit<HealthLogItem, 'id'>) => {
    const created: HealthLogItem = { ...newLog, id: `log-${Date.now()}` };
    setLogs((prev) => [created, ...prev]);
  }, []);

  const handleResolveSymptom = useCallback((id: string) => {
    setSymptoms((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: 'resolved' as const, resolvedAt: 'Today', resolvedBy: 'Jane Doe' }
          : s
      )
    );
    handleAddLog({
      category: 'symptoms',
      title: 'Symptom Resolved',
      badge: 'Marked Resolved',
      badgeType: 'emerald',
      description: 'Verified resolution by Jane Doe.',
      timestamp: 'Just now'
    });
  }, [handleAddLog]);

  const handleRefillPrescription = useCallback((id: string) => {
    setPrescriptions((prev) =>
      prev.map((rx) =>
        rx.id === id
          ? {
              ...rx,
              pillsLeft: (rx.totalPills || 90),
              supplyDaysText: rx.totalPills + ' pills left',
              pillSupplyStatus: 'healthy' as const,
              refillDueText: 'Supply: Refilled Today',
            }
          : rx
      )
    );
    handleAddLog({
      category: 'medication',
      title: 'Prescription Refill Processed',
      badge: 'Refilled',
      badgeType: 'emerald',
      description: 'Refill authorized and processed.',
      timestamp: 'Just now'
    });
  }, [handleAddLog]);

  const handleAddPrescription = useCallback((rx: Omit<Prescription, 'id'>) => {
    const created: Prescription = { ...rx, id: 'rx-' + Date.now() };
    setPrescriptions((prev) => [...prev, created]);
    handleAddLog({
      category: 'medication',
      title: 'New Prescription Added: ' + rx.name,
      badge: 'New Rx',
      badgeType: 'emerald',
      description: 'Prescribed by ' + rx.prescriber + '.',
      timestamp: 'Just now'
    });
  }, [handleAddLog]);

  const handleConfirmExtractedRecords = useCallback((data: {
    biomarkers: Biomarker[];
    symptom: { title: string; severity: number; location: string; notes: string };
    cycle: { flow: 'Medium'; day: number };
  }) => {
    handleAddSymptom({
      title: data.symptom.title,
      severity: data.symptom.severity,
      severityMax: 10,
      severityLabel: 'Mild',
      location: data.symptom.location,
      onset: 'Today ~2 hrs ago',
      status: 'active',
      description: data.symptom.notes
    });
    setCycle((prev) => ({
      ...prev,
      cycleDay: data.cycle.day,
      status: 'Active Period • Flow Recorded',
      flow: data.cycle.flow,
      phase: 'Menses'
    }));
    handleAddLog({
      category: 'labs',
      title: 'Lab Results Verified: Quest Comprehensive Panel',
      badge: '3 Biomarkers Synced',
      badgeType: 'emerald',
      description: 'Fasting Blood Sugar (135 mg/dL), HbA1c (5.8%), Vitamin D (32 ng/mL) verified.',
      timestamp: 'Just now'
    });
    handleAddLog({
      category: 'cycle',
      title: 'Period Started: Cycle Day 1 Recorded',
      badge: 'Medium Flow',
      badgeType: 'indigo',
      description: 'Logged via Vitalix Intelligence multi-modal intake.',
      timestamp: 'Just now'
    });
  }, [handleAddSymptom, handleAddLog]);

  const value: VitalixContextType = {
    currentTab,
    setCurrentTab,
    activeModal,
    setActiveModal,
    vitals,
    cycle,
    diagnoses,
    prescriptions,
    archivedPrescriptions,
    symptoms,
    logs,
    intakePrefill,
    intakeAutoStage,
    handleNavigateToIntake,
    handleUpdateVitals,
    handleAddSymptom,
    handleResolveSymptom,
    handleAddLog,
    handleRefillPrescription,
    handleAddPrescription,
    handleConfirmExtractedRecords,
  };

  return (
    <VitalixContext.Provider value={value}>
      {children}
    </VitalixContext.Provider>
  );
};

export const useVitalix = (): VitalixContextType => {
  const ctx = useContext(VitalixContext);
  if (!ctx) {
    throw new Error('useVitalix must be used within VitalixProvider');
  }
  return ctx;
};
