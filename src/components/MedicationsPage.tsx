import React, { useState } from 'react';
import {
  Prescription,
  ArchivedPrescription
} from '../types';
import { AssistantInputBar } from './AssistantInputBar';
import {
  Pill,
  Search,
  Plus,
  SlidersHorizontal,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  Sun,
  Moon,
  RotateCcw,
  Wind,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface MedicationsPageProps {
  prescriptions: Prescription[];
  archivedPrescriptions: ArchivedPrescription[];
  onOpenModal: (modalName: string) => void;
  onNavigateToIntake: (prefilledText?: string, autoStage?: boolean) => void;
}

export const MedicationsPage: React.FC<MedicationsPageProps> = ({
  prescriptions,
  archivedPrescriptions,
  onOpenModal,
  onNavigateToIntake
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'maintenance' | 'acute' | 'prn'>('all');
  const [archiveTab, setArchiveTab] = useState<'completed' | 'discontinued'>('completed');

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchesSearch =
      rx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.prescriber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.instructions.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'all') return true;
    return rx.type === filterType;
  });

  const maintenanceList = filteredPrescriptions.filter((r) => r.type === 'maintenance');
  const acuteList = filteredPrescriptions.filter((r) => r.type === 'acute');
  const prnList = filteredPrescriptions.filter((r) => r.type === 'prn');

  const filteredArchive = archivedPrescriptions.filter((a) => a.status === archiveTab);

  return (
    <div className="flex flex-col w-full pb-16 space-y-7">
      {/* 1. Assistant Input Bar (Compact) */}
      <AssistantInputBar
        variant="compact"
        onNavigateToIntake={onNavigateToIntake}
      />

      {/* 2. Page Header & Actions */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-serif-display text-2xl sm:text-3xl text-[#3a3530] font-medium tracking-tight">
              Medications & Prescriptions
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono-data text-[10px] bg-[#e8e4db] text-[#5a6344] font-semibold border border-[#dfd3c3] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5a6344] animate-pulse" />
              Telemetry Synced
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#7a7267] max-w-2xl leading-relaxed">
            Manage active maintenance regimens, acute courses, PRN treatments, and pharmacy history.
          </p>
        </div>

        {/* Quick Action / Filter Cluster */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px] sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7267]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter medications, dose..."
              className="w-full h-9 pl-9 pr-4 bg-white border border-[#e8e4db] rounded-xl text-xs text-[#3a3530] placeholder:text-[#7a7267] focus:outline-none focus:border-[#5a6344] transition-all shadow-xs"
            />
          </div>

          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="h-9 px-3 bg-white hover:bg-[#f4f1eb] border border-[#e8e4db] rounded-xl text-xs font-medium text-[#3a3530] focus:outline-none transition-colors shadow-xs cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="maintenance">Maintenance</option>
              <option value="acute">Acute Courses</option>
              <option value="prn">As Needed (PRN)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => onOpenModal('add-prescription')}
            className="h-9 px-4 bg-[#5a6344] text-white hover:bg-[#4a5237] text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Prescription</span>
          </button>
        </div>
      </div>

      {/* 3. Quick Metric Summary Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pill 1 */}
        <div className="bg-white border border-[#e8e4db] rounded-2xl p-4 flex items-center gap-3 shadow-xs hover:border-[#dfd3c3] transition-colors">
          <div className="w-9 h-9 rounded-xl bg-[#f4f1eb] flex items-center justify-center text-[#5a6344] shrink-0 border border-[#e8e4db]">
            <Pill className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono-data text-[10px] text-[#7a7267] uppercase tracking-wider">
              Total Active
            </span>
            <span className="text-xs text-[#3a3530] font-bold truncate">
              {prescriptions.length} Active Prescriptions
            </span>
            <span className="text-[11px] text-[#7a7267] truncate">
              2 Maintenance, 1 Temporary
            </span>
          </div>
        </div>

        {/* Pill 2 */}
        <div className="bg-white border border-[#e8e4db] rounded-2xl p-4 flex items-center gap-3 shadow-xs hover:border-[#dfd3c3] transition-colors">
          <div className="w-9 h-9 rounded-xl bg-[#f4f1eb] flex items-center justify-center text-[#5a6344] shrink-0 border border-[#e8e4db]">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono-data text-[10px] text-[#5a6344] uppercase tracking-wider font-semibold">
              Next Dose
            </span>
            <span className="text-xs text-[#3a3530] font-bold truncate">
              Metformin 500mg
            </span>
            <span className="text-[11px] text-[#7a7267] font-medium">
              1:00 PM Today
            </span>
          </div>
        </div>

        {/* Pill 3: Refill Alert with Click Action */}
        <button
          type="button"
          onClick={() => onOpenModal('request-refill')}
          className="bg-white border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3 shadow-xs hover:border-amber-300 transition-colors text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800 shrink-0 group-hover:scale-105 transition-transform border border-amber-200/60">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono-data text-[10px] text-amber-800 uppercase tracking-wider font-semibold">
              Refill Alert • Tap to Request
            </span>
            <span className="text-xs text-[#3a3530] font-bold truncate">
              Metformin Supply
            </span>
            <span className="text-[11px] text-amber-900 font-medium">
              24 pills left • Due Sep 18
            </span>
          </div>
        </button>

        {/* Pill 4 */}
        <div className="bg-white border border-[#e8e4db] rounded-2xl p-4 flex items-center gap-3 shadow-xs hover:border-[#dfd3c3] transition-colors">
          <div className="w-9 h-9 rounded-xl bg-[#f4f1eb] flex items-center justify-center text-[#5a6344] shrink-0 border border-[#e8e4db]">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono-data text-[10px] text-[#5a6344] uppercase tracking-wider font-semibold">
              Pharmacy On File
            </span>
            <span className="text-xs text-[#3a3530] font-bold truncate">
              Walgreens #4812
            </span>
            <span className="text-[11px] text-[#7a7267] truncate">
              Ready for e-Rx • Verified
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Active Permanent Regimens (Maintenance) */}
      {(filterType === 'all' || filterType === 'maintenance') && (
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg font-mono-data text-[10px] font-bold uppercase tracking-wider bg-[#e8e4db] text-[#5a6344] border border-[#dfd3c3]">
                Maintenance • {maintenanceList.length} Medications
              </span>
              <span className="text-xs text-[#7a7267] hidden md:inline">
                Continuous therapeutic monitoring and recurring refill cycles
              </span>
            </div>
            <span className="font-mono-data text-[11px] text-[#7a7267]">
              Protocol: Chronic Care Tier 1
            </span>
          </div>

          <div className="bg-white border border-[#e8e4db] rounded-3xl shadow-xs divide-y divide-[#e8e4db] overflow-hidden">
            {maintenanceList.map((rx) => (
              <div
                key={rx.id}
                className="p-5 hover:bg-[#f4f1eb]/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Drug Details */}
                <div className="flex items-start gap-3.5 min-w-[280px]">
                  <div className="pt-1 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#5a6344] ring-4 ring-[#e8e4db] inline-block" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-base text-[#3a3530]">
                        {rx.name}
                      </span>
                      {rx.form && (
                        <span className="font-mono-data text-[10px] text-[#544d44] bg-[#f4f1eb] border border-[#e8e4db] px-2 py-0.5 rounded-lg">
                          {rx.form}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-[#544d44] text-xs flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#5a6344]" />
                        <span className="font-medium text-[#3a3530]">{rx.instructions}</span>
                      </span>
                      <span className="text-[#dfd3c3]">•</span>
                      <span className="flex items-center gap-1 text-[#7a7267]">
                        <Sun className="w-3.5 h-3.5" />
                        <span>{rx.scheduleTimes[0] || 'Morning'}</span>
                        {rx.scheduleTimes[1] && (
                          <>
                            <Moon className="w-3.5 h-3.5 ml-1" />
                            <span>{rx.scheduleTimes[1]}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prescriber */}
                <div className="flex flex-col lg:w-48 shrink-0 pl-6 lg:pl-0">
                  <span className="font-mono-data text-[10px] text-[#7a7267] uppercase tracking-wider">
                    Prescribed By
                  </span>
                  <span className="text-xs font-semibold text-[#3a3530]">
                    {rx.prescriber}
                  </span>
                  <span className="text-[11px] text-[#7a7267]">
                    {rx.prescriberSpecialty}
                  </span>
                </div>

                {/* Supply Progress Tracker & Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-5 pl-6 lg:pl-0">
                  <div className="flex flex-col items-start lg:items-end min-w-[140px]">
                    <span
                      className={`font-mono-data text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                        rx.pillSupplyStatus === 'alert'
                          ? 'text-amber-900 bg-amber-50 border border-amber-200'
                          : 'text-[#5a6344] bg-[#e8e4db] border border-[#dfd3c3]'
                      }`}
                    >
                      {rx.supplyDaysText}
                    </span>
                    <span
                      className={`text-[11px] mt-1 font-medium ${
                        rx.pillSupplyStatus === 'alert' ? 'text-amber-800' : 'text-[#7a7267]'
                      }`}
                    >
                      {rx.refillDueText}
                    </span>
                    <div className="w-28 h-1.5 bg-[#e8e4db] rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full ${
                          rx.pillSupplyStatus === 'alert' ? 'bg-amber-600 w-[28%]' : 'bg-[#5a6344] w-[75%]'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenModal('request-refill')}
                    className="px-3.5 py-1.5 bg-[#f4f1eb] hover:bg-[#e8e4db] text-[#3a3530] text-xs font-medium rounded-xl border border-[#e8e4db] shadow-2xs transition-colors shrink-0 cursor-pointer"
                  >
                    Refill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: Active Temporary Courses (Short-Term / Acute) */}
      {(filterType === 'all' || filterType === 'acute') && (
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg font-mono-data text-[10px] font-bold uppercase tracking-wider bg-[#e8e4db] text-[#5a6344] border border-[#dfd3c3]">
                Acute / Short-Term • {acuteList.length} Active Course
              </span>
              <span className="text-xs text-[#7a7267] hidden md:inline">
                Fixed-duration antimicrobial and symptom intervention
              </span>
            </div>
            <span className="font-mono-data text-[11px] text-[#7a7267]">
              Target Completion: Sep 5
            </span>
          </div>

          <div className="bg-white border border-[#e8e4db] rounded-3xl shadow-xs overflow-hidden">
            {acuteList.map((rx) => (
              <div
                key={rx.id}
                className="p-5 hover:bg-[#f4f1eb]/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-[280px]">
                  <div className="pt-1 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#5a6344] ring-4 ring-[#e8e4db] inline-block" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-base text-[#3a3530]">
                        {rx.name}
                      </span>
                      <span className="font-mono-data text-[10px] text-[#544d44] bg-[#f4f1eb] border border-[#e8e4db] px-2 py-0.5 rounded-lg">
                        {rx.form || 'Capsule'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-mono-data text-[10px] uppercase tracking-wider bg-[#e8e4db] text-[#5a6344] font-semibold border border-[#dfd3c3]">
                        {rx.categoryBadge || 'Temporary'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-[#544d44] text-xs">
                      <span className="flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-[#5a6344]" />
                        <span className="font-medium text-[#3a3530]">{rx.instructions}</span>
                      </span>
                      <span className="text-[#dfd3c3]">•</span>
                      <span className="text-[#7a7267]">Breakfast, Lunch, Dinner</span>
                    </div>
                  </div>
                </div>

                {/* Inline Course Duration Progress */}
                <div className="flex flex-col lg:w-64 pl-6 lg:pl-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono-data text-[#3a3530] font-semibold">
                      Day {rx.currentDay || 4} of {rx.totalDays || 7}
                    </span>
                    <span className="font-mono-data text-[#5a6344] font-bold">
                      {rx.progressPercent || 57}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#e8e4db] rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-[#5a6344] rounded-full"
                      style={{ width: `${rx.progressPercent || 57}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-[#7a7267] mt-1">
                    {rx.daysRemainingText}
                  </span>
                </div>

                {/* Prescriber */}
                <div className="flex flex-col lg:w-48 shrink-0 pl-6 lg:pl-0">
                  <span className="font-mono-data text-[10px] text-[#7a7267] uppercase tracking-wider">
                    Prescribed By
                  </span>
                  <span className="text-xs font-semibold text-[#3a3530]">
                    {rx.prescriber}
                  </span>
                  <span className="text-[11px] text-[#7a7267]">
                    {rx.prescriberSpecialty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: As-Needed / PRN Medications */}
      {(filterType === 'all' || filterType === 'prn') && (
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg font-mono-data text-[10px] font-bold uppercase tracking-wider bg-[#e8e4db] text-[#5a6344] border border-[#dfd3c3]">
                As Needed (PRN) • {prnList.length} Protocols
              </span>
              <span className="text-xs text-[#7a7267] hidden md:inline">
                Conditional symptomatic relief with daily threshold ceilings
              </span>
            </div>
            <span className="font-mono-data text-[11px] text-[#7a7267]">
              Telemetry Cap Logged
            </span>
          </div>

          <div className="bg-white border border-[#e8e4db] rounded-3xl shadow-xs divide-y divide-[#e8e4db] overflow-hidden">
            {prnList.map((rx) => (
              <div
                key={rx.id}
                className="p-5 hover:bg-[#f4f1eb]/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-[300px]">
                  <div className="pt-1 text-[#5a6344] shrink-0">
                    {rx.name.toLowerCase().includes('inhaler') ? (
                      <Wind className="w-5 h-5" />
                    ) : (
                      <Pill className="w-5 h-5 text-[#7a7267]" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-base text-[#3a3530]">
                      {rx.name}
                    </span>
                    <p className="text-xs text-[#7a7267] mt-0.5">
                      {rx.instructions}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 pl-8 lg:pl-0">
                  <div className="flex flex-col">
                    <span className="font-mono-data text-[10px] text-[#7a7267] uppercase">
                      Usage Today
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-mono-data text-[10px] px-2 py-0.5 rounded-md mt-0.5 font-semibold ${
                        rx.usageTodayText?.includes('1x')
                          ? 'bg-[#e8e4db] text-[#5a6344] border border-[#dfd3c3]'
                          : 'bg-[#f4f1eb] text-[#7a7267]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          rx.usageTodayText?.includes('1x') ? 'bg-[#5a6344]' : 'bg-[#7a7267]'
                        }`}
                      />
                      {rx.usageTodayText}
                    </span>
                  </div>

                  <div className="flex flex-col pl-4 border-l border-[#e8e4db]">
                    <span className="font-mono-data text-[10px] text-[#7a7267] uppercase">
                      Max Daily Limit
                    </span>
                    <span className="text-xs text-[#3a3530] font-medium mt-0.5">
                      {rx.maxDailyLimitText}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: Past & Discontinued Prescriptions (History Log) */}
      <div className="flex flex-col space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-serif-display text-lg text-[#3a3530] font-medium">
              Prescription History & Completed Courses
            </h2>
            <span className="font-mono-data text-[10px] text-[#5a6344] bg-[#e8e4db] px-2 py-0.5 rounded-md">
              Archive
            </span>
          </div>

          {/* Filter Toggle Tabs */}
          <div className="inline-flex items-center p-1 bg-[#f4f1eb] border border-[#e8e4db] rounded-xl">
            <button
              type="button"
              onClick={() => setArchiveTab('completed')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                archiveTab === 'completed'
                  ? 'bg-white text-[#3a3530] shadow-xs'
                  : 'text-[#7a7267] hover:text-[#3a3530]'
              }`}
            >
              Completed ({archivedPrescriptions.filter((a) => a.status === 'completed').length})
            </button>
            <button
              type="button"
              onClick={() => setArchiveTab('discontinued')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                archiveTab === 'discontinued'
                  ? 'bg-white text-[#3a3530] shadow-xs'
                  : 'text-[#7a7267] hover:text-[#3a3530]'
              }`}
            >
              Discontinued ({archivedPrescriptions.filter((a) => a.status === 'discontinued').length})
            </button>
          </div>
        </div>

        {/* Compact Archive Table */}
        <div className="bg-white border border-[#e8e4db] rounded-3xl shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e8e4db] bg-[#f4f1eb]">
                <th className="py-3 px-4 font-mono-data text-[10px] uppercase text-[#7a7267] font-semibold">
                  Medication
                </th>
                <th className="py-3 px-4 font-mono-data text-[10px] uppercase text-[#7a7267] font-semibold">
                  Type
                </th>
                <th className="py-3 px-4 font-mono-data text-[10px] uppercase text-[#7a7267] font-semibold">
                  Started
                </th>
                <th className="py-3 px-4 font-mono-data text-[10px] uppercase text-[#7a7267] font-semibold">
                  Ended
                </th>
                <th className="py-3 px-4 font-mono-data text-[10px] uppercase text-[#7a7267] font-semibold">
                  Prescriber / Note
                </th>
                <th className="py-3 px-4 font-mono-data text-[10px] uppercase text-[#7a7267] font-semibold text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e4db] text-xs">
              {filteredArchive.map((item) => (
                <tr key={item.id} className="hover:bg-[#f4f1eb]/50 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-[#3a3530]">
                    {item.name}
                  </td>
                  <td className="py-3.5 px-4 text-[#544d44]">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono-data text-[10px] bg-[#f4f1eb] text-[#544d44] border border-[#e8e4db]">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono-data text-[#7a7267]">
                    {item.started}
                  </td>
                  <td className="py-3.5 px-4 font-mono-data text-[#7a7267]">
                    {item.ended}
                  </td>
                  <td className="py-3.5 px-4 text-[#544d44]">
                    {item.notes} • <span className="font-medium text-[#3a3530]">{item.prescriber}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-mono-data text-[10px] font-semibold ${
                        item.status === 'completed'
                          ? 'bg-[#e8e4db] text-[#5a6344] border border-[#dfd3c3]'
                          : 'bg-amber-50 text-amber-800 border border-amber-200/80'
                      }`}
                    >
                      {item.status === 'completed' ? 'Completed' : 'Discontinued'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
