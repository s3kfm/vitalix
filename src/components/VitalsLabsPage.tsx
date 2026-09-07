'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import {
  VitalsData,
  Symptom
} from '../types';
import { AssistantInputBar } from './AssistantInputBar';
import {
  Scale,
  Calendar,
  Upload,
  PlusCircle,
  CheckCircle,
  AlertTriangle,
  Edit,
} from 'lucide-react';

interface VitalsLabsPageProps {
  vitals: VitalsData;
  symptoms: Symptom[];
}

export const VitalsLabsPage: React.FC<VitalsLabsPageProps> = ({
  vitals,
  symptoms,
}) => {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('30');
  const [symptomTab, setSymptomTab] = useState<'active' | 'resolved'>('active');

  const activeSymptoms = symptoms.filter((s) => s.status === 'active');
  const resolvedSymptoms = symptoms.filter((s) => s.status === 'resolved');

  return (
    <div className="flex flex-col w-full pb-16 space-y-6">
      {/* 1. Assistant Input Bar (Compact) */}
      <AssistantInputBar
        variant="compact"

      />

      {/* 2. Page Header & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl shadow-xs border border-[#e8e4db]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono-data text-[10px] uppercase tracking-wider bg-[#e8e4db] text-[#5a6344] font-semibold border border-[#dfd3c3]">
              Continuous Telemetry
            </span>
            <span className="w-2 h-2 rounded-full bg-[#5a6344] animate-pulse" />
            <span className="font-mono-data text-[11px] text-[#7a7267]">
              Synchronized 4m ago
            </span>
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl text-[#3a3530] font-medium tracking-tight mt-1">
            Vitals & Lab Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-[#7a7267] max-w-3xl leading-relaxed">
            Continuous clinical telemetry, scheduled biometric trends, diagnostic reports, and patient-reported symptoms.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center bg-[#f4f1eb] border border-[#e8e4db] px-3 py-2 rounded-xl">
            <Calendar className="w-4 h-4 text-[#7a7267] mr-2" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#3a3530] focus:outline-none cursor-pointer pr-2"
            >
              <option value="30">Last 30 Days</option>
              <option value="7">Last 7 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="all">All Records</option>
            </select>
          </div>

          {/* Action Buttons */}
          <button
            type="button"
            onClick={() => router.push('/ai-intake')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#f4f1eb] hover:bg-[#e8e4db] text-[#3a3530] text-xs font-medium rounded-xl border border-[#e8e4db] shadow-2xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#5a6344]" />
            <span>Upload Report</span>
          </button>

          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 px-4 py-2 bg-[#5a6344] hover:bg-[#4a5237] text-white text-xs font-medium rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Vital or Lab</span>
          </button>
        </div>
      </div>

      {/* 3. KPI Overview Strip (4 Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Blood Pressure */}
        <div className="bg-white p-5 rounded-3xl shadow-xs border border-[#e8e4db] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#7a7267] uppercase tracking-wider">
              Blood Pressure
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-mono-data text-[10px] bg-[#e8e4db] text-[#5a6344] font-semibold border border-[#dfd3c3]">
              Optimal
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="font-mono-data text-2xl sm:text-3xl font-bold text-[#3a3530]">
              {vitals.systolic === 120 ? '118/76' : `${vitals.systolic}/${vitals.diastolic}`}
            </span>
            <span className="font-mono-data text-xs text-[#7a7267]">mmHg</span>
          </div>
          <div className="flex items-center justify-between pt-2 mt-1 bg-[#f4f1eb] px-3 py-1.5 rounded-xl text-[11px]">
            <span className="font-mono-data text-[#544d44]">Sitting • Resting</span>
            <span className="font-mono-data text-[#7a7267]">Today 2:15 PM</span>
          </div>
        </div>

        {/* Fasting Glucose */}
        <div className="bg-white p-5 rounded-3xl shadow-xs border border-[#e8e4db] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#7a7267] uppercase tracking-wider">
              Fasting Glucose
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-mono-data text-[10px] bg-[#e8e4db] text-[#5a6344] font-semibold border border-[#dfd3c3]">
              In Target
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="font-mono-data text-2xl sm:text-3xl font-bold text-[#3a3530]">
              94
            </span>
            <span className="font-mono-data text-xs text-[#7a7267]">mg/dL</span>
          </div>
          <div className="flex items-center justify-between pt-2 mt-1 bg-[#f4f1eb] px-3 py-1.5 rounded-xl text-[11px]">
            <span className="font-mono-data text-[#544d44]">Fasting 10h baseline</span>
            <span className="font-mono-data text-[#7a7267]">Today 7:30 AM</span>
          </div>
        </div>

        {/* Non-Fasting Glucose */}
        <div className="bg-white p-5 rounded-3xl shadow-xs border border-[#e8e4db] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#7a7267] uppercase tracking-wider">
              Non-Fasting Glucose
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-mono-data text-[10px] bg-[#e8e4db] text-[#5a6344] font-semibold border border-[#dfd3c3]">
              In Target
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="font-mono-data text-2xl sm:text-3xl font-bold text-[#3a3530]">
              {vitals.nonFastingGlucose}
            </span>
            <span className="font-mono-data text-xs text-[#7a7267]">mg/dL</span>
          </div>
          <div className="flex items-center justify-between pt-2 mt-1 bg-[#f4f1eb] px-3 py-1.5 rounded-xl text-[11px]">
            <span className="font-mono-data text-[#544d44]">2h Post-prandial</span>
            <span className="font-mono-data text-[#7a7267]">Today 1:30 PM</span>
          </div>
        </div>

        {/* Body Weight */}
        <div className="bg-white p-5 rounded-3xl shadow-xs border border-[#e8e4db] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#7a7267] uppercase tracking-wider">
              Body Weight
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-mono-data text-[10px] bg-[#e8e4db] text-[#5a6344] font-semibold border border-[#dfd3c3]">
              -1.8 lbs
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="font-mono-data text-2xl sm:text-3xl font-bold text-[#3a3530]">
              138.4
            </span>
            <span className="font-mono-data text-xs text-[#7a7267]">lbs</span>
          </div>
          <div className="flex items-center justify-between pt-2 mt-1 bg-[#f4f1eb] px-3 py-1.5 rounded-xl text-[11px]">
            <span className="font-mono-data text-[#544d44]">BMI 21.8 • Normal</span>
            <span className="font-mono-data text-[#7a7267]">Today 8:00 AM</span>
          </div>
        </div>
      </div>

      {/* 4. Dedicated Weight Tracking Card */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xs border border-[#e8e4db] flex flex-col space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#5a6344]" />
              <h2 className="font-serif-display text-xl sm:text-2xl text-[#3a3530] font-medium">
                Body Composition & Weight Tracking
              </h2>
            </div>
            <p className="text-xs text-[#7a7267] mt-0.5">
              Multi-frequency bio-impedance measurements and steady progress trends
            </p>
          </div>
          <button
            type="button"
            disabled
            className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 bg-[#f4f1eb] hover:bg-[#e8e4db] text-[#3a3530] text-xs font-medium rounded-xl border border-[#e8e4db] transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#5a6344]" />
            <span>Record Weigh-In</span>
          </button>
        </div>

        {/* Weight Breakdown Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-[#f4f1eb] p-4 rounded-2xl border border-[#e8e4db] flex flex-col">
            <span className="font-mono-data text-[11px] text-[#7a7267]">Current Weight</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono-data text-2xl font-bold text-[#3a3530]">138.4</span>
              <span className="font-mono-data text-xs text-[#7a7267]">lbs</span>
            </div>
            <span className="font-mono-data text-[11px] text-[#5a6344] font-medium mt-1">
              -1.8 lbs past 30 days
            </span>
          </div>

          <div className="bg-[#f4f1eb] p-4 rounded-2xl border border-[#e8e4db] flex flex-col">
            <span className="font-mono-data text-[11px] text-[#7a7267]">Body Mass Index (BMI)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono-data text-2xl font-bold text-[#3a3530]">21.8</span>
              <span className="font-mono-data text-xs text-[#7a7267]">kg/m²</span>
            </div>
            <span className="font-mono-data text-[11px] text-[#5a6344] font-medium mt-1">
              Healthy weight status
            </span>
          </div>

          <div className="bg-[#f4f1eb] p-4 rounded-2xl border border-[#e8e4db] flex flex-col">
            <span className="font-mono-data text-[11px] text-[#7a7267]">Body Fat %</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono-data text-2xl font-bold text-[#3a3530]">23.4</span>
              <span className="font-mono-data text-xs text-[#7a7267]">%</span>
            </div>
            <span className="font-mono-data text-[11px] text-[#5a6344] font-medium mt-1">
              Athletic / Healthy
            </span>
          </div>

          <div className="bg-[#f4f1eb] p-4 rounded-2xl border border-[#e8e4db] flex flex-col">
            <span className="font-mono-data text-[11px] text-[#7a7267]">Lean Muscle Mass</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono-data text-2xl font-bold text-[#3a3530]">101.2</span>
              <span className="font-mono-data text-xs text-[#7a7267]">lbs</span>
            </div>
            <span className="font-mono-data text-[11px] text-[#5a6344] font-medium mt-1">
              +0.4 lbs muscle retention
            </span>
          </div>
        </div>
      </div>

      {/* 5. Symptoms Tracker & Clinical Correlates */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xs border border-[#e8e4db] flex flex-col space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#5a6344]" />
              <h2 className="font-serif-display text-xl sm:text-2xl text-[#3a3530] font-medium">
                Symptoms Tracker & Clinical Correlates
              </h2>
            </div>
            <p className="text-xs text-[#7a7267] mt-0.5">
              Active self-reported episodes with physiological correlation & resolution logging
            </p>
          </div>
          <button
            type="button"
            disabled
            className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 bg-[#5a6344] hover:bg-[#4a5237] text-white text-xs font-medium rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>+ Report New Symptom</span>
          </button>
        </div>

        {/* Active vs Resolved Tabs */}
        <div className="flex items-center border-b border-[#e8e4db] gap-4">
          <button
            type="button"
            onClick={() => setSymptomTab('active')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              symptomTab === 'active'
                ? 'text-[#5a6344] border-b-2 border-[#5a6344]'
                : 'text-[#7a7267] hover:text-[#3a3530]'
            }`}
          >
            <span>Active Symptoms</span>
            <span className="px-2 py-0.2 rounded-full font-mono-data text-[10px] bg-amber-50 text-amber-800 font-bold border border-amber-200/80">
              {activeSymptoms.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSymptomTab('resolved')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              symptomTab === 'resolved'
                ? 'text-[#5a6344] border-b-2 border-[#5a6344]'
                : 'text-[#7a7267] hover:text-[#3a3530]'
            }`}
          >
            <span>Resolved History</span>
            <span className="px-2 py-0.2 rounded-full font-mono-data text-[10px] bg-[#e8e4db] text-[#5a6344] font-semibold border border-[#dfd3c3]">
              {resolvedSymptoms.length}
            </span>
          </button>
        </div>

        {/* Active Symptoms Grid */}
        {symptomTab === 'active' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSymptoms.length === 0 ? (
              <div className="col-span-2 py-8 text-center bg-[#f4f1eb] rounded-2xl border border-[#e8e4db]">
                <CheckCircle className="w-8 h-8 text-[#5a6344] mx-auto mb-1.5" />
                <p className="font-serif-display text-base font-medium text-[#3a3530]">
                  No Active Symptoms
                </p>
                <p className="text-xs text-[#7a7267]">
                  All patient-reported discomforts are currently resolved.
                </p>
              </div>
            ) : (
              activeSymptoms.map((sym) => (
                <div
                  key={sym.id}
                  className="bg-[#f4f1eb] p-5 rounded-2xl border border-[#e8e4db] flex flex-col justify-between space-y-4 hover:bg-[#eae6de] transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-mono-data text-[10px] bg-amber-50 text-amber-800 font-semibold border border-amber-200/80">
                        Active • {sym.severityLabel}
                      </span>
                      <span className="font-mono-data text-[11px] text-[#7a7267]">
                        Onset: {sym.onset}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <h3 className="font-medium text-sm text-[#3a3530]">
                        {sym.title}
                      </h3>
                    </div>

                    <div className="mt-3 space-y-1.5 bg-white p-3.5 rounded-xl border border-[#e8e4db]">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#7a7267]">Reported Severity</span>
                        <span className="font-mono-data font-bold text-[#3a3530]">
                          {sym.severity} / 10 ({sym.severityLabel})
                        </span>
                      </div>
                      {/* Meter */}
                      <div className="w-full h-1.5 bg-[#e8e4db] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-600 rounded-full"
                          style={{ width: `${(sym.severity / 10) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between font-mono-data text-[10px] text-[#7a7267] pt-1">
                        <span>Location: {sym.location}</span>
                        <span>Onset: {sym.onset}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#e8e4db]">
                    <button
                      type="button"
                      disabled
                      className="text-[#5a6344] text-xs font-medium hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Add Note</span>
                    </button>
                    <button
                      type="button"
                      disabled
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#f4f1eb] text-[#5a6344] text-xs font-medium rounded-xl border border-[#e8e4db] shadow-2xs transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Mark as Resolved</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Resolved History */}
        {symptomTab === 'resolved' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#3a3530]">
                Archived Symptom History
              </span>
              <span className="font-mono-data text-[11px] text-[#7a7267]">
                Verified by Jane Doe
              </span>
            </div>

            <div className="divide-y divide-[#e8e4db] bg-[#f4f1eb] rounded-2xl p-3.5 border border-[#e8e4db]">
              {resolvedSymptoms.map((res) => (
                <div
                  key={res.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-[#5a6344] shrink-0" />
                    <div>
                      <div className="font-medium text-xs text-[#3a3530]">
                        {res.title}
                      </div>
                      <div className="font-mono-data text-[10px] text-[#7a7267]">
                        Onset: {res.onset} • Location: {res.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="px-2.5 py-0.5 rounded-full font-mono-data text-[10px] bg-[#e8e4db] text-[#5a6344] font-semibold border border-[#dfd3c3]">
                      Resolved {res.resolvedAt || 'Recently'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
