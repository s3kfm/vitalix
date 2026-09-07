import React, { useState } from 'react';
import {
  VitalsData,
  CycleData,
  Diagnosis,
  Prescription,
  HealthLogItem
} from '../types';
import { AssistantInputBar } from './AssistantInputBar';
import {
  Activity,
  Heart,
  TrendingDown,
  TrendingUp,
  Scale,
  Calendar,
  Pill,
  Clock,
  Plus,
  X,
  FileUp,
  AlertCircle,
  FileText,
  CheckCircle2,
  Droplet,
  Flame,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface OverviewPageProps {
  vitals: VitalsData;
  cycle: CycleData;
  diagnoses: Diagnosis[];
  prescriptions: Prescription[];
  logs: HealthLogItem[];
  onOpenModal: (modalName: string) => void;
  onNavigateToIntake: (prefilledText?: string, autoStage?: boolean) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  vitals,
  cycle,
  diagnoses,
  prescriptions,
  logs,
  onOpenModal,
  onNavigateToIntake
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'vitals' | 'symptoms' | 'labs' | 'cycle'>('all');
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const filteredLogs = logs.filter((log) => {
    if (activeFilter === 'all') return true;
    return log.category === activeFilter;
  });

  return (
    <div className="flex flex-col w-full pb-16 space-y-6">
      {/* 1. Assistant Input Prompt Card */}
      <AssistantInputBar
        variant="hero"
        onNavigateToIntake={onNavigateToIntake}
      />

      {/* 2. Core Vitals & Biometrics Grid (4 KPI Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Cardiovascular */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#e8e4db] hover:border-[#dfd3c3] hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#5a6344]/5 rounded-full blur-2xl pointer-events-none -mr-6 -mt-6" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#5a6344]" />
                <span className="text-xs font-semibold text-[#7a7267] uppercase tracking-wider">
                  Cardiovascular
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono-data text-[11px] font-semibold bg-[#e8e4db] text-[#5a6344] border border-[#dfd3c3]">
                <TrendingDown className="w-3 h-3" /> {vitals.bpDelta}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 my-2">
              <span className="font-mono-data text-3xl font-bold text-[#3a3530] tracking-tight">
                {vitals.systolic}/{vitals.diastolic}
              </span>
              <span className="font-mono-data text-xs text-[#7a7267] uppercase font-medium">
                mmHg
              </span>
            </div>

            <p className="text-xs text-[#544d44] flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#5a6344]" />
              Resting Heart Rate: <span className="font-semibold text-[#3a3530]">{vitals.restingHeartRate} bpm</span>
            </p>
          </div>

          {/* Sparkline Wave */}
          <div className="mt-4 pt-2">
            <svg className="w-full h-8 overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 200 32">
              <path
                className="text-[#5a6344]"
                d="M0,16 L40,16 L50,6 L60,26 L70,12 L78,20 L86,16 L120,16 L130,10 L140,22 L150,16 L200,16"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              />
              <circle className="fill-[#5a6344]" cx="200" cy="16" r="3.5" />
            </svg>
          </div>
        </div>

        {/* Card 2: Biochemistry */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#e8e4db] hover:border-[#dfd3c3] hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none -mr-6 -mt-6" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-semibold text-[#7a7267] uppercase tracking-wider">
                  Biochemistry
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono-data text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                <TrendingUp className="w-3 h-3" /> {vitals.fastingGlucoseStatus}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 my-2">
              <span className="font-mono-data text-3xl font-bold text-amber-700 tracking-tight">
                {vitals.fastingGlucose}
              </span>
              <span className="font-mono-data text-xs text-[#7a7267] uppercase font-medium">
                mg/dL
              </span>
            </div>

            <p className="text-xs text-[#544d44]">
              Fasting Glucose <span className="text-[#7a7267] font-mono-data text-[11px]">({vitals.fastingGlucoseTime})</span>
            </p>
          </div>

          <div className="mt-4 pt-2 flex items-center justify-between border-t border-[#e8e4db]/80 text-[11px]">
            <div className="flex items-center gap-1 font-mono-data text-[#7a7267]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5a6344]" /> Optimal: 70–99
            </div>
            <span className="font-mono-data text-amber-700 font-semibold">
              +{vitals.fastingGlucose - 99} mg/dL above max
            </span>
          </div>
        </div>

        {/* Card 3: Biometrics */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#e8e4db] hover:border-[#dfd3c3] hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#5a6344]/5 rounded-full blur-2xl pointer-events-none -mr-6 -mt-6" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#5a6344]" />
                <span className="text-xs font-semibold text-[#7a7267] uppercase tracking-wider">
                  Biometrics
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono-data text-[11px] font-semibold bg-[#e8e4db] text-[#5a6344] border border-[#dfd3c3]">
                <TrendingDown className="w-3 h-3" /> {vitals.weightDelta}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 my-2">
              <span className="font-mono-data text-3xl font-bold text-[#3a3530] tracking-tight">
                {vitals.weight}
              </span>
              <span className="font-mono-data text-xs text-[#7a7267] uppercase font-medium">
                lbs
              </span>
            </div>

            <p className="text-xs text-[#544d44]">
              Height: <span className="font-medium text-[#3a3530]">{vitals.height}</span> • BMI: <span className="font-medium text-[#3a3530]">{vitals.bmi}</span>
            </p>
          </div>

          {/* Target Progress Bar */}
          <div className="mt-4 pt-2">
            <div className="flex justify-between items-center mb-1 text-[11px]">
              <span className="font-mono-data text-[#7a7267]">Target: {vitals.targetWeight} lbs</span>
              <span className="font-mono-data text-[#5a6344] font-bold">{vitals.targetProgressPercent}% Completed</span>
            </div>
            <div className="w-full bg-[#f4f1eb] h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-[#5a6344] h-full rounded-full transition-all duration-500"
                style={{ width: `${vitals.targetProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Menstrual Cycle */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#e8e4db] hover:border-[#dfd3c3] hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#dfd3c3]/20 rounded-full blur-2xl pointer-events-none -mr-6 -mt-6" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#5a6344]" />
                <span className="text-xs font-semibold text-[#7a7267] uppercase tracking-wider">
                  Menstrual Cycle
                </span>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full font-mono-data text-[11px] font-semibold bg-[#e8e4db] text-[#5a6344] border border-[#dfd3c3]">
                {cycle.status}
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-2">
              <span className="font-mono-data text-3xl font-bold text-[#3a3530] tracking-tight">
                Day {cycle.cycleDay}
              </span>
              <span className="text-xs text-[#7a7267] font-medium">
                Mid-Cycle
              </span>
            </div>

            <p className="text-xs text-[#544d44]">
              Cycle length: {cycle.lengthDays} days • {cycle.regularity}
            </p>
          </div>

          {/* 4 Phases Representation */}
          <div className="mt-4 pt-2 flex items-center justify-between gap-1">
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="h-1.5 w-full rounded-full bg-[#dfd3c3]" />
              <span className="font-mono-data text-[9px] text-[#7a7267]">Follicular</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="h-1.5 w-full rounded-full bg-[#5a6344] ring-2 ring-[#e8e4db]" />
              <span className="font-mono-data text-[9px] font-bold text-[#5a6344]">Ovulation</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="h-1.5 w-full rounded-full bg-[#e8e4db]" />
              <span className="font-mono-data text-[9px] text-[#7a7267]">Luteal</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="h-1.5 w-full rounded-full bg-[#e8e4db]" />
              <span className="font-mono-data text-[9px] text-[#7a7267]">Menses</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Middle Split Section (50% Active Diagnoses / 50% Active Prescriptions) */}
      <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Left: Active Diagnoses & Status */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#e8e4db] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#5a6344]" />
              <h3 className="font-serif-display text-lg font-medium text-[#3a3530]">
                Active Diagnoses & Status
              </h3>
            </div>
            <span className="font-mono-data text-xs text-[#7a7267]">
              {diagnoses.length} Tracked
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Asthma */}
            <div className="bg-[#f4f1eb] p-3.5 rounded-2xl flex items-start justify-between gap-3 hover:bg-[#eae6de] transition-colors border border-[#e8e4db]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs text-[#3a3530]">
                    Asthma
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-mono-data text-[10px] bg-[#e8e4db] text-[#5a6344] font-semibold border border-[#dfd3c3]">
                    Chronic
                  </span>
                </div>
                <p className="text-xs text-[#7a7267] mt-0.5">
                  Inhaler PRN, Last flare 3 mo ago
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#7a7267] shrink-0 mt-0.5" />
            </div>

            {/* Right Ankle Sprain */}
            <div className="bg-[#f4f1eb] p-3.5 rounded-2xl flex items-start justify-between gap-3 hover:bg-[#eae6de] transition-colors border border-[#e8e4db]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs text-[#3a3530]">
                    Right Ankle Sprain
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-mono-data text-[10px] bg-[#e8e4db] text-[#5a6344] font-semibold border border-[#dfd3c3]">
                    Healing
                  </span>
                </div>
                <p className="text-xs text-[#7a7267] mt-0.5">
                  Physical therapy 2x/wk, Day 12 of recovery
                </p>
              </div>
              <Activity className="w-4 h-4 text-[#5a6344] shrink-0 mt-0.5" />
            </div>
          </div>

          {/* Active Alert Note: Headache */}
          <div className="bg-amber-50/80 p-3.5 rounded-2xl flex items-start justify-between gap-3 border border-amber-200/70">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs text-amber-900">
                    Headache (Severity 4/10)
                  </span>
                  <span className="font-mono-data text-[10px] text-[#7a7267] font-medium">
                    Logged 2:15 PM
                  </span>
                </div>
                <p className="text-xs text-[#544d44] mt-0.5">
                  Frontal tension, hydrated with 500ml water
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenModal('log-symptom')}
              className="shrink-0 px-3 py-1 bg-white hover:bg-[#f4f1eb] text-[#3a3530] text-xs font-medium rounded-xl border border-[#e8e4db] shadow-2xs transition-colors cursor-pointer"
            >
              + Note
            </button>
          </div>
        </div>

        {/* Right: Active Prescriptions */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#e8e4db] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-[#5a6344]" />
              <h3 className="font-serif-display text-lg font-medium text-[#3a3530]">
                Active Prescriptions
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full font-mono-data text-[10px] bg-[#e8e4db] text-[#5a6344] font-semibold border border-[#dfd3c3]">
              2 Active Rx
            </span>
          </div>

          <div className="space-y-3">
            {/* Metformin */}
            <div className="bg-[#f4f1eb] p-3.5 rounded-2xl flex items-center justify-between gap-3 border border-[#e8e4db] hover:bg-[#eae6de] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#e8e4db] text-[#5a6344] flex items-center justify-center shrink-0">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-[#3a3530]">
                      Metformin 500mg
                    </span>
                    <span className="font-mono-data text-[10px] text-[#5a6344] font-semibold bg-[#e8e4db] px-1.5 py-0.2 rounded">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-[#544d44]">
                    1 Tablet Twice Daily • Refill in 18 days (30 qty)
                  </p>
                  <span className="font-mono-data text-[10px] text-[#7a7267]">
                    Dr. R. Vance • Cardiology/Endo
                  </span>
                </div>
              </div>
              <Link
                href="/medications"
                className="shrink-0 px-3 py-1.5 bg-white hover:bg-[#e8e4db] text-[#3a3530] text-xs font-medium rounded-xl border border-[#e8e4db] shadow-2xs transition-colors cursor-pointer"
              >
                Manage
              </Link>
            </div>

            {/* Lisinopril */}
            <div className="bg-[#f4f1eb] p-3.5 rounded-2xl flex items-center justify-between gap-3 border border-[#e8e4db] hover:bg-[#eae6de] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#dfd3c3]/70 text-[#5a6344] flex items-center justify-center shrink-0">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-[#3a3530]">
                      Lisinopril 10mg
                    </span>
                    <span className="font-mono-data text-[10px] text-[#5a6344] font-semibold bg-[#e8e4db] px-1.5 py-0.2 rounded">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-[#544d44]">
                    1 Tablet Daily (Evening) • Refill in 5 days (10 qty)
                  </p>
                  <span className="font-mono-data text-[10px] text-[#7a7267]">
                    Dr. R. Vance • Cardiology
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenModal('request-refill')}
                className="shrink-0 px-3.5 py-1.5 bg-[#5a6344] hover:bg-[#4a5237] text-white text-xs font-medium rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Request Refill
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bottom Feed: Recent Health Logs & Activity Stream */}
      <section className="bg-white rounded-3xl p-6 shadow-xs border border-[#e8e4db] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e8e4db]/80">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-[#5a6344]" />
            <h3 className="font-serif-display text-lg font-medium text-[#3a3530]">
              Recent Health Logs & Activity Stream
            </h3>
          </div>

          {/* Feed Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'vitals', 'symptoms', 'labs', 'cycle'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-[#5a6344] text-white font-semibold shadow-xs'
                    : 'text-[#7a7267] hover:text-[#3a3530] hover:bg-[#e8e4db]/50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Entries List */}
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start justify-between p-3 rounded-2xl hover:bg-[#f4f1eb] transition-colors border border-transparent hover:border-[#e8e4db]"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    log.category === 'symptoms'
                      ? 'bg-amber-50 text-amber-700'
                      : log.category === 'labs'
                      ? 'bg-amber-50 text-amber-700'
                      : log.category === 'cycle'
                      ? 'bg-[#dfd3c3]/70 text-[#5a6344]'
                      : log.category === 'vitals'
                      ? 'bg-[#e8e4db] text-[#5a6344]'
                      : 'bg-[#e8e4db] text-[#5a6344]'
                  }`}
                >
                  {log.category === 'symptoms' && <AlertCircle className="w-4 h-4" />}
                  {log.category === 'labs' && <Flame className="w-4 h-4" />}
                  {log.category === 'cycle' && <Droplet className="w-4 h-4" />}
                  {log.category === 'vitals' && <Activity className="w-4 h-4" />}
                  {log.category === 'medication' && <Pill className="w-4 h-4" />}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-xs text-[#3a3530]">
                      {log.title}
                    </span>
                    <span
                      className={`px-2 py-0.2 rounded-full font-mono-data text-[10px] font-semibold ${
                        log.badgeType === 'rose'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                          : log.badgeType === 'indigo'
                          ? 'bg-[#e8e4db] text-[#5a6344] border border-[#dfd3c3]'
                          : log.badgeType === 'cyan'
                          ? 'bg-[#dfd3c3]/60 text-[#5a6344] border border-[#dfd3c3]'
                          : 'bg-[#e8e4db] text-[#5a6344] border border-[#dfd3c3]'
                      }`}
                    >
                      {log.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#7a7267] mt-0.5">
                    {log.description}
                  </p>
                </div>
              </div>

              <span className="font-mono-data text-[11px] text-[#7a7267] shrink-0 pl-2">
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Floating Action Hub (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
        {quickMenuOpen && (
          <div className="mb-3 bg-white p-3 rounded-3xl shadow-xl w-64 space-y-1.5 border border-[#e8e4db] animate-in slide-in-from-bottom-2 duration-150">
            <div className="px-2 py-1 flex items-center justify-between border-b border-[#e8e4db] pb-2 mb-1">
              <span className="text-[11px] font-mono-data uppercase font-semibold text-[#7a7267]">
                Quick Entry
              </span>
              <span className="font-mono-data text-[10px] text-[#5a6344] font-bold">
                TELEMETRY
              </span>
            </div>

            <button
              onClick={() => {
                setQuickMenuOpen(false);
                onOpenModal('log-vitals');
              }}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#f4f1eb] text-left transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#e8e4db] text-[#5a6344] flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#3a3530] block">Log Vitals</span>
                <span className="font-mono-data text-[10px] text-[#7a7267]">BP, Heart Rate, SpO2</span>
              </div>
            </button>

            <button
              onClick={() => {
                setQuickMenuOpen(false);
                onOpenModal('log-symptom');
              }}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#f4f1eb] text-left transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#3a3530] block">Log Symptom</span>
                <span className="font-mono-data text-[10px] text-[#7a7267]">Pain scale, notes, intensity</span>
              </div>
            </button>

            <button
              onClick={() => {
                setQuickMenuOpen(false);
                onOpenModal('record-weighin');
              }}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#f4f1eb] text-left transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#e8e4db] text-[#5a6344] flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#3a3530] block">Record Weigh-In</span>
                <span className="font-mono-data text-[10px] text-[#7a7267]">Weight, BMI, body fat</span>
              </div>
            </button>

            <button
              onClick={() => {
                setQuickMenuOpen(false);
                onNavigateToIntake('', true);
              }}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#f4f1eb] text-left transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#dfd3c3]/70 text-[#5a6344] flex items-center justify-center shrink-0">
                <FileUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#3a3530] block">Upload Lab / Image</span>
                <span className="font-mono-data text-[10px] text-[#7a7267]">PDF, scan, smart intake</span>
              </div>
            </button>
          </div>
        )}

        <button
          onClick={() => setQuickMenuOpen(!quickMenuOpen)}
          type="button"
          className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#5a6344] hover:bg-[#4a5237] text-white text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95 ring-4 ring-[#5a6344]/20 cursor-pointer"
        >
          {quickMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          <span>Log Data</span>
        </button>
      </div>
    </div>
  );
};
