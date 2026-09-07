'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Calendar,
  Paperclip,
  ArrowUp,
  FileText,
  UploadCloud,
  CheckCircle2,
  X,
  PlusCircle,
  AlertTriangle,
  Flame,
  Droplet,
  ShieldCheck,
  Edit2,
  Check,
  Clock,
  Layers,
} from 'lucide-react';
import {
  Biomarker,
} from '../types';

interface AiIntakePageProps {
  initialFilter?: string;
  prefilledPrompt?: string;
  autoStaged?: boolean;
}

export const AiIntakePage: React.FC<AiIntakePageProps> = ({
  initialFilter = 'all',
  prefilledPrompt = '',
  autoStaged = false
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>(autoStaged ? 'state-3' : initialFilter);
  const [state1Text, setState1Text] = useState(prefilledPrompt);
  const [state3Text, setState3Text] = useState(
    prefilledPrompt || 'Please log that my period started today (medium flow, mild cramps) and save my blood work PDF.'
  );
  const [stagedFileName] = useState('Quest_Comprehensive_Panel.pdf');
  const [hasAttachment, setHasAttachment] = useState(true);

  // Date detection state
  const [detectedDate, setDetectedDate] = useState('Oct 24, 2024');
  const [isEditingDate, setIsEditingDate] = useState(false);

  // Extracted Biomarkers
  const [biomarkers] = useState<Biomarker[]>([
    {
      id: 'bm-1',
      name: 'Fasting Blood Sugar',
      value: '135',
      unit: 'mg/dL',
      referenceRange: '70 – 99 mg/dL • Glucose / Metabolic',
      category: 'Glucose',
      status: 'elevated'
    },
    {
      id: 'bm-2',
      name: 'HbA1c (Glycated Hemoglobin)',
      value: '5.8',
      unit: '%',
      referenceRange: '< 5.7% • Optimal Glycemic Control',
      category: 'HbA1c',
      status: 'normal'
    },
    {
      id: 'bm-3',
      name: 'Vitamin D (25-Hydroxy)',
      value: '32',
      unit: 'ng/mL',
      referenceRange: '30 – 100 ng/mL • Immuno-Endocrine',
      category: 'Vitamin D',
      status: 'optimal'
    }
  ]);

  return (
    <div className="flex flex-col w-full pb-16">
      {/* 1. Interactive View Switcher & Header Controls */}
      <section className="w-full mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#5a6344]/10 text-[#5a6344] border border-[#5a6344]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-mono-data text-[10px] uppercase font-semibold">
                HOW IT WORKS • PATIENT EXPERIENCE
              </span>
            </div>
            <h1 className="font-serif-display text-2xl sm:text-3xl text-[#3a3530] font-bold tracking-tight">
              AI Health Chat & Intake Experience
            </h1>
            <p className="text-xs sm:text-sm text-[#7d756d] leading-relaxed">
              Drop files, type symptoms, or log cycle notes naturally. Vitalix extracts the clinical details, confirms the date with you, and saves them to your medical profile.
            </p>
          </div>

          {/* Quick Metrics & Spec Status */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end px-3 py-1.5 rounded-lg bg-[#f4f1eb] border border-[#e8e4db]">
              <span className="font-mono-data text-[10px] text-[#8c827a] uppercase">
                Patient Review
              </span>
              <span className="font-mono-data text-xs font-bold text-[#5a6344]">
                Always Verified
              </span>
            </div>
            <div className="flex flex-col items-end px-3 py-1.5 rounded-lg bg-[#f4f1eb] border border-[#e8e4db]">
              <span className="font-mono-data text-[10px] text-[#8c827a] uppercase">
                Your Data
              </span>
              <span className="font-mono-data text-xs font-bold text-[#8c7355]">
                Private & Secure
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Filter Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-[#f4f1eb] rounded-xl shadow-2xs border border-[#e8e4db]">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
              selectedFilter === 'all'
                ? 'bg-[#5a6344] text-[#fcf9f5] shadow-2xs'
                : 'text-[#6c655c] hover:bg-[#e8e4db]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Steps Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('state-1')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
              selectedFilter === 'state-1'
                ? 'bg-[#5a6344] text-[#fcf9f5] shadow-2xs font-semibold'
                : 'text-[#6c655c] hover:bg-[#e8e4db]'
            }`}
          >
            <span className="w-2 h-2 rounded-full border border-current opacity-60" />
            <span>1. Ready to Type</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('state-2')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
              selectedFilter === 'state-2'
                ? 'bg-[#5a6344] text-[#fcf9f5] shadow-2xs font-semibold'
                : 'text-[#6c655c] hover:bg-[#e8e4db]'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>2. Dragging a File</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('state-3')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
              selectedFilter === 'state-3'
                ? 'bg-[#5a6344] text-[#fcf9f5] shadow-2xs font-semibold'
                : 'text-[#6c655c] hover:bg-[#e8e4db]'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>3. File Attached</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('state-4')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
              selectedFilter === 'state-4'
                ? 'bg-[#5a6344] text-[#fcf9f5] shadow-2xs font-semibold'
                : 'text-[#6c655c] hover:bg-[#e8e4db]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>4. Review & Confirm</span>
          </button>
        </div>
      </section>

      {/* Success Notification Banner */}

      {/* 2. Interactive State Gallery Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ==================== STATE 1: IDLE DEFAULT ==================== */}
        {(selectedFilter === 'all' || selectedFilter === 'state-1') && (
          <div className="flex flex-col bg-[#fcf9f5] rounded-xl shadow-2xs p-5 border border-[#e8e4db] transition-all duration-300">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e8e4db]">
              <div className="flex items-center gap-2">
                <span className="font-mono-data text-[10px] px-2 py-0.5 rounded bg-[#f4f1eb] text-[#3a3530] uppercase font-semibold">
                  Step 01
                </span>
                <h2 className="font-headline text-sm font-bold text-[#3a3530]">
                  Empty State • Ready to Chat
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono-data text-[10px] bg-[#f4f1eb] text-[#7d756d]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8c827a]" />
                Ready to Chat
              </span>
            </div>

            <p className="text-xs text-[#7d756d] mb-5 leading-relaxed">
              A clean and simple chat box where you can type questions, record symptoms, or attach health records anytime.
            </p>

            {/* Component Rendering Container */}
            <div className="bg-[#f4f1eb] p-5 rounded-xl flex items-center justify-center min-h-[260px] border border-[#e8e4db]">
              <div className="w-full max-w-xl bg-white rounded-2xl shadow-xs border border-[#e8e4db] p-3.5">
                <textarea
                  value={state1Text}
                  onChange={(e) => setState1Text(e.target.value)}
                  placeholder="Upload a document, lab result or type to record your symptoms or cycle..."
                  rows={2}
                  className="w-full bg-transparent resize-none text-xs sm:text-sm text-[#3a3530] placeholder:text-[#8c827a] focus:outline-none px-1.5 py-1 leading-relaxed"
                />

                <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-[#e8e4db]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedFilter('state-2')}
                      className="p-1.5 rounded-lg text-[#8c827a] hover:text-[#3a3530] hover:bg-[#f4f1eb] transition-colors"
                      title="Attach file or lab report"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f4f1eb] text-[#3a3530] text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-[#5a6344]" />
                      <span className="text-[#5a6344]">Vitalix Intelligence</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!state1Text.trim()}
                    onClick={() => {
                      setState3Text(state1Text);
                      setSelectedFilter('state-3');
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      state1Text.trim()
                        ? 'bg-[#5a6344] text-[#fcf9f5] shadow-2xs hover:bg-[#4a5237] cursor-pointer'
                        : 'bg-[#f4f1eb] text-[#8c827a] cursor-not-allowed'
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 bg-[#f4f1eb]/70 rounded-lg p-3 border border-[#e8e4db]">
              <span className="block font-mono-data text-[10px] text-[#8c827a] uppercase font-semibold">
                What You Can Do
              </span>
              <span className="text-xs text-[#3a3530] font-medium mt-0.5 block">
                Type a question, mention symptoms, or attach blood tests and doctor notes.
              </span>
            </div>
          </div>
        )}

        {/* ==================== STATE 2: DRAG & DROP HOVER ==================== */}
        {(selectedFilter === 'all' || selectedFilter === 'state-2') && (
          <div className="flex flex-col bg-[#fcf9f5] rounded-xl shadow-2xs p-5 border border-[#e8e4db] transition-all duration-300">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e8e4db]">
              <div className="flex items-center gap-2">
                <span className="font-mono-data text-[10px] px-2 py-0.5 rounded bg-[#5a6344] text-[#fcf9f5] uppercase font-semibold">
                  Step 02
                </span>
                <h2 className="font-headline text-sm font-bold text-[#3a3530]">
                  Drop a File
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono-data text-[10px] bg-[#5a6344]/10 text-[#5a6344] font-semibold border border-[#5a6344]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5a6344] animate-pulse" />
                Drop Your File Here
              </span>
            </div>

            <p className="text-xs text-[#7d756d] mb-5 leading-relaxed">
              Simply drag your lab results, photos, or medical notes directly into the box to get started.
            </p>

            {/* Component Rendering Container */}
            <div className="bg-[#f4f1eb] p-5 rounded-xl flex items-center justify-center min-h-[260px] border border-[#e8e4db]">
              <div
                onClick={() => setSelectedFilter('state-3')}
                className="relative w-full max-w-xl bg-[#5a6344]/5 border-2 border-dashed border-[#5a6344]/40 rounded-2xl p-6 text-center cursor-pointer hover:bg-[#5a6344]/10 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-[#5a6344] text-[#fcf9f5] flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="font-headline text-sm font-bold text-[#5a6344] mb-1">
                  Drop medical records, lab PDFs, or images here to analyze
                </p>
                <p className="font-mono-data text-[11px] text-[#7d756d] tracking-wide mb-3">
                  Supports PDF, images, or documents • Your data stays completely private
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#e8e4db] font-mono-data text-[10px] text-[#3a3530] font-semibold shadow-2xs">
                    Lab Results
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#e8e4db] font-mono-data text-[10px] text-[#3a3530] font-semibold shadow-2xs">
                    LH / OPK Strips
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#e8e4db] font-mono-data text-[10px] text-[#3a3530] font-semibold shadow-2xs">
                    Doctor&apos;s Notes
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 bg-[#f4f1eb]/70 rounded-lg p-3 border border-[#e8e4db]">
              <span className="block font-mono-data text-[10px] text-[#8c827a] uppercase font-semibold">
                Supported Files
              </span>
              <span className="text-xs text-[#3a3530] font-medium mt-0.5 block">
                PDFs, doctor notes, scan photos, and test strip images up to 25MB
              </span>
            </div>
          </div>
        )}

        {/* ==================== STATE 3: DOCUMENT ATTACHED & READY ==================== */}
        {(selectedFilter === 'all' || selectedFilter === 'state-3') && (
          <div className="flex flex-col bg-[#fcf9f5] rounded-xl shadow-2xs p-5 border border-[#e8e4db] transition-all duration-300">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e8e4db]">
              <div className="flex items-center gap-2">
                <span className="font-mono-data text-[10px] px-2 py-0.5 rounded bg-[#8c7355]/15 text-[#8c7355] uppercase font-semibold">
                  Step 03
                </span>
                <h2 className="font-headline text-sm font-bold text-[#3a3530]">
                  Document or Symptom Staged
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono-data text-[10px] bg-[#8c7355]/10 text-[#8c7355] font-semibold border border-[#8c7355]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8c7355]" />
                File Attached • Ready
              </span>
            </div>

            <p className="text-xs text-[#7d756d] mb-5 leading-relaxed">
              Your file or note is staged. You can add extra details or questions before sending to Vitalix.
            </p>

            {/* Component Rendering Container */}
            <div className="bg-[#f4f1eb] p-5 rounded-xl flex items-center justify-center min-h-[260px] border border-[#e8e4db]">
              <div className="w-full max-w-xl bg-white rounded-2xl shadow-xs border border-[#e8e4db] p-3.5">
                {/* File Attachment Chip */}
                {hasAttachment && (
                  <div className="flex flex-wrap items-center gap-2 pb-2">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#f4f1eb] border border-[#e8e4db]">
                      <FileText className="w-4 h-4 text-[#b4533c]" />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#3a3530] leading-tight truncate max-w-[200px]">
                          {stagedFileName}
                        </span>
                        <span className="font-mono-data text-[10px] text-[#8c827a] leading-tight">
                          1.4 MB • Ready to review
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#5a6344]/15 text-[#5a6344] font-mono-data text-[9px] font-bold ml-1">
                        <Check className="w-2.5 h-2.5" />
                        Ready
                      </span>
                      <button
                        type="button"
                        onClick={() => setHasAttachment(false)}
                        className="p-0.5 rounded text-[#8c827a] hover:text-[#b4533c] hover:bg-[#e8e4db] transition-colors ml-1"
                        title="Remove attachment"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <textarea
                  value={state3Text}
                  onChange={(e) => setState3Text(e.target.value)}
                  rows={2}
                  className="w-full bg-transparent resize-none text-xs sm:text-sm text-[#3a3530] focus:outline-none px-1.5 py-1 leading-relaxed"
                />

                <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-[#e8e4db]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHasAttachment(true)}
                      className="p-1.5 rounded-lg text-[#8c827a] hover:text-[#3a3530] hover:bg-[#f4f1eb] transition-colors"
                      title="Add another file"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f4f1eb] text-[#3a3530] text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-[#5a6344]" />
                      <span className="text-[#5a6344]">Vitalix Intelligence</span>
                    </div>
                  </div>

                  {/* Active Primary Send Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedFilter('state-4')}
                    className="w-8 h-8 rounded-full bg-[#5a6344] text-[#fcf9f5] hover:bg-[#4a5237] shadow-xs flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
                    title="Analyze and extract"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 bg-[#f4f1eb]/70 rounded-lg p-3 border border-[#e8e4db]">
              <span className="block font-mono-data text-[10px] text-[#8c827a] uppercase font-semibold">
                Multi-Modal Input
              </span>
              <span className="text-xs text-[#3a3530] font-medium mt-0.5 block">
                Combines attached lab PDF with natural conversational period & symptom notes
              </span>
            </div>
          </div>
        )}

        {/* ==================== STATE 4: REVIEW & CONFIRM ==================== */}
        {(selectedFilter === 'all' || selectedFilter === 'state-4') && (
          <div className="flex flex-col bg-[#fcf9f5] rounded-xl shadow-2xs p-5 border-2 border-[#5a6344]/40 xl:col-span-2 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#e8e4db] gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono-data text-[10px] px-2 py-0.5 rounded bg-[#5a6344] text-[#fcf9f5] uppercase font-semibold">
                  Step 04
                </span>
                <h2 className="font-headline text-base sm:text-lg font-bold text-[#3a3530]">
                  Review Extracted Items & Confirm
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono-data text-[10px] bg-[#5a6344]/10 text-[#5a6344] font-semibold border border-[#5a6344]/20">
                <span className="w-2 h-2 rounded-full bg-[#5a6344]" />
                Staged for Health Log Confirmation
              </span>
            </div>

            <p className="text-xs text-[#7d756d] mb-4 leading-relaxed">
              Vitalix parsed your upload and notes into structured records. Check the detected date and review the extracted biomarkers, symptoms, and ovulation markers before saving to your official chart.
            </p>

            {/* Interactive Review Workspace Container */}
            <div className="bg-[#f4f1eb] p-4 sm:p-5 rounded-xl border border-[#e8e4db] space-y-4">
              {/* Top Date Detection Banner */}
              <div className="bg-white rounded-xl border border-[#e8e4db] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#5a6344]/10 text-[#5a6344] flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isEditingDate ? (
                        <input
                          type="text"
                          value={detectedDate}
                          onChange={(e) => setDetectedDate(e.target.value)}
                          className="px-2 py-0.5 border border-[#e8e4db] rounded text-xs font-semibold text-[#3a3530] bg-white"
                        />
                      ) : (
                        <span className="text-xs sm:text-sm font-semibold text-[#3a3530]">
                          Detected Date: {detectedDate}
                        </span>
                      )}
                      <span className="font-mono-data text-[10px] px-1.5 py-0.5 rounded bg-[#f4f1eb] text-[#7d756d]">
                        From Quest lab header
                      </span>
                    </div>
                    <p className="text-xs text-[#7d756d] mt-0.5">
                      Is this the correct date for this medical entry?
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setIsEditingDate(!isEditingDate)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#5a6344]/40 bg-white hover:bg-[#5a6344]/10 text-[#5a6344] text-xs font-semibold transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{isEditingDate ? 'Save Date' : 'Edit Date'}</span>
                  </button>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#5a6344]/10 text-[#5a6344] font-mono-data text-[11px] font-semibold border border-[#5a6344]/20">
                    <Check className="w-3.5 h-3.5" /> Confirmed
                  </span>
                </div>
              </div>

              {/* Main Items Header */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#5a6344]" />
                  <h3 className="font-headline text-sm font-semibold text-[#3a3530]">
                    Items Ready to Record (3 Categories)
                  </h3>
                </div>
                <span className="font-mono-data text-xs text-[#8c827a]">
                  {biomarkers.length + 3} data points identified
                </span>
              </div>

              {/* Section 1: Lab Biomarkers */}
              <div className="bg-white rounded-xl border border-[#e8e4db] overflow-hidden shadow-2xs">
                <div className="bg-[#f4f1eb] px-3.5 py-2 flex items-center justify-between border-b border-[#e8e4db]">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#8c7355]" />
                    <span className="text-xs font-semibold text-[#3a3530]">
                      Lab Biomarkers (from Quest_Comprehensive_Panel.pdf)
                    </span>
                  </div>
                  <span className="font-mono-data text-xs font-semibold text-[#8c7355]">
                    {biomarkers.length} items
                  </span>
                </div>

                <div className="divide-y divide-[#e8e4db]">
                  {biomarkers.map((bm) => (
                    <div
                      key={bm.id}
                      className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#fcf9f5] transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {bm.status === 'elevated' ? (
                          <AlertTriangle className="w-4 h-4 text-[#b4533c] mt-0.5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-[#5a6344] mt-0.5 shrink-0" />
                        )}
                        <div>
                          <span className="text-xs sm:text-sm font-semibold text-[#3a3530]">
                            {bm.name}
                          </span>
                          <p className="font-mono-data text-[11px] text-[#8c827a]">
                            Reference: {bm.referenceRange}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="font-mono-data text-sm font-bold text-[#3a3530]">
                          {bm.value} {bm.unit}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono-data text-[10px] font-semibold ${
                            bm.status === 'elevated'
                              ? 'bg-[#b4533c]/10 text-[#b4533c] border border-[#b4533c]/20'
                              : 'bg-[#5a6344]/10 text-[#5a6344] border border-[#5a6344]/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              bm.status === 'elevated' ? 'bg-[#b4533c]' : 'bg-[#5a6344]'
                            }`}
                          />
                          {bm.status === 'elevated' ? 'Elevated' : bm.status === 'optimal' ? 'Optimal' : 'Normal Range'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Symptoms Staged */}
              <div className="bg-white rounded-xl border border-[#e8e4db] overflow-hidden shadow-2xs">
                <div className="bg-[#f4f1eb] px-3.5 py-2 flex items-center justify-between border-b border-[#e8e4db]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#8c7355]" />
                    <span className="text-xs font-semibold text-[#3a3530]">
                      Symptoms Log (from typed natural language note)
                    </span>
                  </div>
                  <span className="font-mono-data text-xs text-[#8c7355] font-semibold">
                    1 entry
                  </span>
                </div>

                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-[#3a3530]">
                        Mild Tension Headache
                      </span>
                      <span className="px-2 py-0.2 rounded-full font-mono-data text-[10px] bg-[#f4f1eb] text-[#7d756d]">
                        Onset: ~2 hrs ago
                      </span>
                    </div>
                    <p className="text-xs text-[#7d756d]">
                      Severity 4/10 • Frontal forehead pressure • Non-migraine characteristics
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono-data text-[10px] bg-[#8c7355]/15 text-[#8c7355] border border-[#8c7355]/25 font-semibold">
                      Mild (4/10)
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Cycle & Ovulation Tracker Staged */}
              <div className="bg-white rounded-xl border border-[#e8e4db] overflow-hidden shadow-2xs">
                <div className="bg-[#5a6344]/10 px-3.5 py-2.5 flex items-center justify-between border-b border-[#5a6344]/20">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#5a6344]" />
                    <span className="text-xs font-semibold text-[#5a6344]">
                      Period & Cycle Tracker (from note)
                    </span>
                  </div>
                  <span className="font-mono-data text-[10px] px-2 py-0.5 rounded bg-[#5a6344] text-[#fcf9f5] font-semibold">
                    Cycle Day 1 • Flow Recorded
                  </span>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#f4f1eb] border border-[#e8e4db] flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#5a6344]/15 text-[#5a6344] shrink-0">
                      <Droplet className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#3a3530]">
                          Period Event: Period Started
                        </span>
                        <span className="font-mono-data text-xs text-[#5a6344] font-bold">
                          Day 1
                        </span>
                      </div>
                      <p className="text-xs text-[#7d756d] mt-0.5">
                        Flow: Medium / Normal • Onset: Today (Oct 24) • Predicted cycle: 28 days
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#f4f1eb] border border-[#e8e4db] flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#8c7355]/15 text-[#8c7355] shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#3a3530]">
                          Cycle Status & Tracking
                        </span>
                        <span className="font-mono-data text-xs text-[#8c7355] font-bold">
                          Active Period
                        </span>
                      </div>
                      <p className="text-xs text-[#7d756d] mt-0.5">
                        Starts new cycle count • Resets cycle countdown calendar
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#f4f1eb] border border-[#e8e4db] flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#b4533c]/15 text-[#b4533c] shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#3a3530]">
                          Period Symptoms Logged
                        </span>
                        <span className="font-mono-data text-xs text-[#b4533c] font-bold">
                          Mild Cramps
                        </span>
                      </div>
                      <p className="text-xs text-[#7d756d] mt-0.5">
                        Lower pelvic cramping (3/10) • Tagged to Day 1 entry
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#5a6344]/10 border border-[#5a6344]/25 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#5a6344] text-[#fcf9f5] shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#5a6344]">
                          Natural End-of-Period Support
                        </span>
                        <span className="font-mono-data text-[10px] text-[#5a6344] font-bold uppercase">
                          Ready to Log
                        </span>
                      </div>
                      <p className="text-xs text-[#3a3530] mt-0.5">
                        Also tracks: &quot;My period ended today&quot; to automatically record period duration
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Confirmation Action Bar */}
              <div className="px-4 sm:px-6 py-4 bg-white rounded-xl border border-[#e8e4db] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2 text-[#7d756d]">
                  <ShieldCheck className="w-4 h-4 text-[#5a6344] shrink-0" />
                  <span className="text-xs">
                    All entries are encrypted and tagged with Jane Doe&apos;s verified patient record.
                  </span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <Link
                    href="/"
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#7d756d] hover:text-[#b4533c] hover:bg-[#b4533c]/10 transition-colors"
                  >
                    Discard
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsEditingDate(true)}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#3a3530] hover:bg-[#f4f1eb] border border-[#e8e4db] transition-colors"
                  >
                    Edit Details
                  </button>
                  <button
                    type="button"
                    disabled
                    className="px-5 py-2.5 rounded-lg bg-[#5a6344] text-[#fcf9f5] text-xs font-semibold hover:bg-[#4a5237] transition-all shadow-xs hover:shadow-md flex items-center gap-2 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Save to Health Records</span>
                  </button>
                </div>
              </div>
            </div>

            {/* State Inspector Micro-Specs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-3 bg-[#f4f1eb]/70 rounded-lg p-3 border border-[#e8e4db]">
              <div>
                <span className="block font-mono-data text-[10px] text-[#8c827a] uppercase font-semibold">
                  Date Detection
                </span>
                <span className="text-xs text-[#3a3530] font-semibold">
                  Automatic header scan + one-click date editor
                </span>
              </div>
              <div>
                <span className="block font-mono-data text-[10px] text-[#8c827a] uppercase font-semibold">
                  Safety Gate
                </span>
                <span className="text-xs text-[#3a3530] font-semibold">
                  Never autosaves; requires explicit patient sign-off
                </span>
              </div>
              <div>
                <span className="block font-mono-data text-[10px] text-[#8c827a] uppercase font-semibold">
                  Sync Target
                </span>
                <span className="text-xs text-[#3a3530] font-semibold">
                  Synchronizes to Vitals, Labs & Cycle Insights tabs
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Dedicated Showcase Section: How Natural Logging Works */}
      <section className="mt-12">
        <div className="mb-6 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#5a6344]/10 text-[#5a6344] border border-[#5a6344]/20 font-mono-data text-[10px] font-semibold uppercase">
            <Sparkles className="w-3 h-3" /> Smart Multi-Modal Intake
          </div>
          <h3 className="font-serif-display text-xl sm:text-2xl text-[#3a3530] font-bold">
            How Natural Logging Works (Labs, Symptoms & Period Tracking)
          </h3>
          <p className="text-xs sm:text-sm text-[#7d756d] max-w-3xl">
            Whether you type a quick message, speak a symptom note, or upload a photo of an ovulation test strip, Vitalix extracts the clinical facts with gentle human language.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card A: Lab Results Intake */}
          <div className="bg-[#fcf9f5] rounded-xl p-5 border border-[#e8e4db] shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-[#8c7355]/15 text-[#8c7355] flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono-data text-[10px] px-2 py-0.5 rounded bg-[#f4f1eb] text-[#8c7355] font-semibold">
                FLOW A
              </span>
              <h4 className="font-headline text-sm font-bold text-[#3a3530]">
                Lab Results Intake
              </h4>
            </div>
            <p className="text-xs text-[#7d756d] mb-4">
              Upload blood tests, Quest slips, or clinical PDF printouts directly.
            </p>
            <div className="bg-[#f4f1eb] rounded-lg p-3 space-y-2 text-xs text-[#6c655c]">
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#8c7355] mt-0.5 shrink-0" />
                <div>
                  <strong className="text-[#3a3530]">Detects Date & Lab Name:</strong> e.g., Quest, Labcorp, Hospital date stamps
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#8c7355] mt-0.5 shrink-0" />
                <div>
                  <strong className="text-[#3a3530]">Extracts Biomarkers:</strong> Glucose, Cholesterol, Thyroid, Vitamins & reference ranges
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#8c7355] mt-0.5 shrink-0" />
                <div>
                  <strong className="text-[#3a3530]">Flags High/Low:</strong> Color-coded badges in friendly, understandable language
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Symptom Quick Log */}
          <div className="bg-[#fcf9f5] rounded-xl p-5 border border-[#e8e4db] shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-[#5a6344]/15 text-[#5a6344] flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono-data text-[10px] px-2 py-0.5 rounded bg-[#f4f1eb] text-[#5a6344] font-semibold">
                FLOW B
              </span>
              <h4 className="font-headline text-sm font-bold text-[#3a3530]">
                Symptom Quick Log
              </h4>
            </div>
            <p className="text-xs text-[#7d756d] mb-4">
              Type everyday phrasing: <em>&quot;Tension headache since noon, feels like a 4 out of 10.&quot;</em>
            </p>
            <div className="bg-[#f4f1eb] rounded-lg p-3 space-y-2 text-xs text-[#6c655c]">
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#5a6344] mt-0.5 shrink-0" />
                <div>
                  <strong className="text-[#3a3530]">Severity Scoring:</strong> Automatically normalizes to a clinical 1–10 scale
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#5a6344] mt-0.5 shrink-0" />
                <div>
                  <strong className="text-[#3a3530]">Body Region & Timing:</strong> Captures location, onset time, and known triggers
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#5a6344] mt-0.5 shrink-0" />
                <div>
                  <strong className="text-[#3a3530]">Cross-Correlations:</strong> Connects symptoms with cycle day and blood markers
                </div>
              </div>
            </div>
          </div>

          {/* Card C: Period & Cycle Tracking */}
          <div className="bg-[#fcf9f5] rounded-xl p-5 border-2 border-[#5a6344]/40 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-[#5a6344]/15 text-[#5a6344] flex items-center justify-center mb-4">
              <Droplet className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono-data text-[10px] px-2 py-0.5 rounded bg-[#5a6344]/15 text-[#5a6344] font-bold">
                FLOW C • FEATURED
              </span>
              <h4 className="font-headline text-sm font-bold text-[#3a3530]">
                Period & Cycle Tracking
              </h4>
            </div>
            <p className="text-xs text-[#7d756d] mb-4">
              Type everyday phrases: <em>&quot;I had my period today&quot;</em> or <em>&quot;My period ended today, medium flow.&quot;</em>
            </p>
            <div className="bg-[#f4f1eb] rounded-lg p-3 space-y-2 text-xs text-[#6c655c]">
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#5a6344] mt-0.5 shrink-0" />
                <div>
                  <strong className="text-[#3a3530]">Period Start Date:</strong> Marks Cycle Day 1, resets cycle countdown and estimated length
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#5a6344] mt-0.5 shrink-0" />
                <div>
                  <strong className="text-[#3a3530]">Period End Date:</strong> Automatically logs bleeding duration (e.g., 5 days)
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#5a6344] mt-0.5 shrink-0" />
                <div>
                  <strong className="text-[#3a3530]">Flow & Symptoms:</strong> Notes spotting, light, medium, or heavy flow and cramps
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Deep Architecture Breakdown & Specification Matrix */}
      <section className="mt-12 bg-[#fcf9f5] rounded-xl shadow-2xs border border-[#e8e4db] p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#e8e4db] gap-4 mb-4">
          <div>
            <h3 className="font-serif-display text-base sm:text-lg font-bold text-[#3a3530]">
              The 4-Step Intake & Confirmation Architecture
            </h3>
            <p className="text-xs text-[#7d756d]">
              How each stage ensures accuracy, patient control, and medical record integrity.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5a6344]/10 text-[#5a6344] font-mono-data text-[11px] font-semibold border border-[#5a6344]/20">
            <ShieldCheck className="w-4 h-4" /> Bank-Grade Privacy & HIPAA Verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f4f1eb] text-[#8c827a] font-mono-data text-[10px] uppercase">
              <tr>
                <th className="p-3 rounded-l-lg">Step</th>
                <th className="p-3">What You See</th>
                <th className="p-3">When It Happens</th>
                <th className="p-3">Helpful Features</th>
                <th className="p-3 rounded-r-lg">Privacy & Safety</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e4db] text-[#6c655c]">
              <tr>
                <td className="p-3 font-semibold text-[#3a3530] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8c827a]" />
                  1. Ready to Type
                </td>
                <td className="p-3 text-[#7d756d]">A clean message box with easy upload buttons</td>
                <td className="p-3 text-[#7d756d]">Whenever you open the health chat</td>
                <td className="p-3 text-[#7d756d]">Multi-line typing, smart suggestions for vitals & cycles</td>
                <td className="p-3 font-mono-data text-[#5a6344] font-semibold">End-to-end encrypted</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-[#3a3530] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#5a6344]" />
                  2. Dragging a File
                </td>
                <td className="p-3 text-[#7d756d]">Helpful highlighted drop zone welcoming your file or test photo</td>
                <td className="p-3 text-[#7d756d]">While dragging a document or strip photo over the screen</td>
                <td className="p-3 text-[#7d756d]">Checks file formats and verifies readability in real time</td>
                <td className="p-3 font-mono-data text-[#5a6344] font-semibold">Private secure upload</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-[#3a3530] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8c7355]" />
                  3. File Attached
                </td>
                <td className="p-3 text-[#7d756d]">Your file shown neatly staged alongside natural text notes</td>
                <td className="p-3 text-[#7d756d]">Right after upload completes and user writes questions</td>
                <td className="p-3 text-[#7d756d]">Add multiple files or remove anytime before sending</td>
                <td className="p-3 font-mono-data text-[#5a6344] font-semibold">Protected by HIPAA standards</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-[#3a3530] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#5a6344]" />
                  4. Review & Confirm
                </td>
                <td className="p-3 text-[#7d756d]">Detected date header, structured items table, and Save button</td>
                <td className="p-3 text-[#7d756d]">Immediately after parsing before saving to health chart</td>
                <td className="p-3 text-[#7d756d]">Confirm period start/end date, edit flow values, Confirm & Save or Discard</td>
                <td className="p-3 font-mono-data text-[#5a6344] font-semibold">Explicit patient consent gate</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
