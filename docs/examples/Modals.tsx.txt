import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Activity,
  Heart,
  Scale,
  Calendar,
  Pill,
  Check,
  Clock,
  AlertTriangle,
  FileText,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import {
  VitalsData,
  Symptom,
  Prescription,
  HealthLogItem
} from '../types';

interface ModalsProps {
  activeModal: string | null;
  onClose: () => void;
  vitals: VitalsData;
  onUpdateVitals: (newVitals: Partial<VitalsData>) => void;
  onAddSymptom: (symptom: Omit<Symptom, 'id'>) => void;
  onAddLog: (log: Omit<HealthLogItem, 'id'>) => void;
  prescriptions: Prescription[];
  onRefillPrescription: (id: string) => void;
  onAddPrescription: (rx: Omit<Prescription, 'id'>) => void;
}

export const Modals: React.FC<ModalsProps> = ({
  activeModal,
  onClose,
  vitals,
  onUpdateVitals,
  onAddSymptom,
  onAddLog,
  prescriptions,
  onRefillPrescription,
  onAddPrescription
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Vitals form
  const [systolic, setSystolic] = useState(vitals.systolic.toString());
  const [diastolic, setDiastolic] = useState(vitals.diastolic.toString());
  const [heartRate, setHeartRate] = useState(vitals.restingHeartRate.toString());
  const [glucose, setGlucose] = useState(vitals.fastingGlucose.toString());

  // Symptom form
  const [symptomTitle, setSymptomTitle] = useState('');
  const [symptomSeverity, setSymptomSeverity] = useState(4);
  const [symptomLocation, setSymptomLocation] = useState('Frontal / Bilateral');
  const [symptomNotes, setSymptomNotes] = useState('');

  // Weigh-in form
  const [weightInput, setWeightInput] = useState(vitals.weight.toString());
  const [bodyFatInput, setBodyFatInput] = useState(vitals.bodyFatPercent.toString());

  // Refill prescription target
  const [refillRxId, setRefillRxId] = useState(prescriptions[0]?.id || '');
  const [refillSuccess, setRefillSuccess] = useState(false);

  // New Prescription form
  const [newRxName, setNewRxName] = useState('');
  const [newRxDosage, setNewRxDosage] = useState('');
  const [newRxType, setNewRxType] = useState<'maintenance' | 'acute' | 'prn'>('maintenance');
  const [newRxInstructions, setNewRxInstructions] = useState('1 tablet daily');
  const [newRxPrescriber, setNewRxPrescriber] = useState('Dr. Aris Thorne');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3a3530]/45 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-[#fcf9f5] rounded-2xl shadow-xl border border-[#e8e4db] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= MODAL: GLOBAL SEARCH ================= */}
        {activeModal === 'search' && (
          <div className="flex flex-col">
            <div className="p-3.5 border-b border-[#e8e4db] flex items-center gap-3 bg-white">
              <Search className="w-5 h-5 text-[#8c827a]" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to search vitals, symptoms, medications, or reports..."
                className="flex-1 bg-transparent text-sm text-[#3a3530] placeholder:text-[#a89f91] focus:outline-none"
              />
              <button
                onClick={onClose}
                className="p-1 rounded-md text-[#7d756d] hover:text-[#3a3530] hover:bg-[#f4f1eb]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 divide-y divide-[#e8e4db] max-h-96 overflow-y-auto bg-[#fcf9f5]">
              <div className="py-2">
                <span className="text-[11px] font-mono-data uppercase tracking-wider text-[#8c827a] px-2">
                  Navigation & Shortcuts
                </span>
                <div className="mt-1 space-y-1">
                  <Link
                    href="/"
                    onClick={onClose}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#f4f1eb] text-left text-xs text-[#3a3530] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#5a6344]" />
                      <span className="font-medium">Overview Dashboard</span>
                    </div>
                    <span className="text-[10px] font-mono-data text-[#8c827a]">Jump</span>
                  </Link>
                  <Link
                    href="/vitals-and-labs"
                    onClick={onClose}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#f4f1eb] text-left text-xs text-[#3a3530] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-[#8c7355]" />
                      <span className="font-medium">Vitals & Lab Telemetry</span>
                    </div>
                    <span className="text-[10px] font-mono-data text-[#8c827a]">Jump</span>
                  </Link>
                  <Link
                    href="/medications"
                    onClick={onClose}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#f4f1eb] text-left text-xs text-[#3a3530] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-[#6e7755]" />
                      <span className="font-medium">Medications & Prescriptions</span>
                    </div>
                    <span className="text-[10px] font-mono-data text-[#8c827a]">Jump</span>
                  </Link>
                  <Link
                    href="/ai-intake"
                    onClick={onClose}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#5a6344]/10 text-left text-xs text-[#5a6344] font-medium transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#5a6344]" />
                      <span>AI Health Chat & Intake Engine</span>
                    </div>
                    <span className="text-[10px] font-mono-data text-[#5a6344] bg-[#5a6344]/15 px-1.5 py-0.5 rounded">
                      Intake
                    </span>
                  </Link>
                </div>
              </div>

              <div className="py-2">
                <span className="text-[11px] font-mono-data uppercase tracking-wider text-[#8c827a] px-2">
                  Clinical Metrics & Logs
                </span>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center justify-between px-3 py-1.5 text-xs text-[#3a3530]">
                    <span>Blood Pressure: 120/80 mmHg</span>
                    <span className="font-mono-data text-[#5a6344] font-semibold">Optimal</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 text-xs text-[#3a3530]">
                    <span>Fasting Glucose: 135 mg/dL</span>
                    <span className="font-mono-data text-[#b4533c] font-semibold">+14% Elevated</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 text-xs text-[#3a3530]">
                    <span>Metformin 500mg (24 pills left)</span>
                    <span className="font-mono-data text-[#8c827a]">Refill due Sep 18</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL: LOG VITALS ================= */}
        {activeModal === 'log-vitals' && (
          <div className="flex flex-col">
            <div className="p-4 border-b border-[#e8e4db] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#5a6344]/10 text-[#5a6344] flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-headline text-base font-semibold text-[#3a3530]">
                    Record Vital Signs
                  </h3>
                  <p className="text-xs text-[#7d756d]">
                    Log Blood Pressure, Resting Heart Rate & Glucose
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-[#7d756d] hover:text-[#3a3530]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 bg-[#fcf9f5]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3a3530] mb-1">
                    Systolic (mmHg)
                  </label>
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e8e4db] rounded-lg text-sm text-[#3a3530] focus:border-[#5a6344] focus:outline-none"
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3a3530] mb-1">
                    Diastolic (mmHg)
                  </label>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e8e4db] rounded-lg text-sm text-[#3a3530] focus:border-[#5a6344] focus:outline-none"
                    placeholder="80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3a3530] mb-1">
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e8e4db] rounded-lg text-sm text-[#3a3530] focus:border-[#5a6344] focus:outline-none"
                    placeholder="68"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3a3530] mb-1">
                    Fasting Glucose (mg/dL)
                  </label>
                  <input
                    type="number"
                    value={glucose}
                    onChange={(e) => setGlucose(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e8e4db] rounded-lg text-sm text-[#3a3530] focus:border-[#5a6344] focus:outline-none"
                    placeholder="94"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#f4f1eb] border-t border-[#e8e4db] flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#7d756d] hover:bg-[#e8e4db] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateVitals({
                    systolic: Number(systolic) || 120,
                    diastolic: Number(diastolic) || 80,
                    restingHeartRate: Number(heartRate) || 68,
                    fastingGlucose: Number(glucose) || 94
                  });
                  onAddLog({
                    category: 'vitals',
                    title: `Vitals Recorded: ${systolic}/${diastolic} mmHg`,
                    badge: 'Manual Log',
                    badgeType: 'cyan',
                    description: `Resting HR: ${heartRate} bpm, Fasting Glucose: ${glucose} mg/dL`,
                    timestamp: 'Just now'
                  });
                  onClose();
                }}
                className="px-4 py-1.5 text-xs font-semibold text-[#fcf9f5] bg-[#5a6344] hover:bg-[#4a5237] rounded-lg shadow-xs transition-colors"
              >
                Save Vitals
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL: LOG SYMPTOM ================= */}
        {activeModal === 'log-symptom' && (
          <div className="flex flex-col">
            <div className="p-4 border-b border-[#e8e4db] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#b4533c]/10 text-[#b4533c] flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-headline text-base font-semibold text-[#3a3530]">
                    Report Symptom
                  </h3>
                  <p className="text-xs text-[#7d756d]">
                    Log severity, anatomical location, and description
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-[#7d756d] hover:text-[#3a3530]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 bg-[#fcf9f5]">
              <div>
                <label className="block text-xs font-semibold text-[#3a3530] mb-1">
                  Symptom Name
                </label>
                <input
                  type="text"
                  value={symptomTitle}
                  onChange={(e) => setSymptomTitle(e.target.value)}
                  placeholder="e.g. Throbbing Headache, Back Stiffness..."
                  className="w-full px-3 py-2 bg-white border border-[#e8e4db] rounded-lg text-sm text-[#3a3530] focus:border-[#5a6344] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-[#3a3530]">
                    Reported Severity (1 to 10)
                  </label>
                  <span className="font-mono-data text-xs font-bold text-[#3a3530]">
                    {symptomSeverity} / 10 ({symptomSeverity <= 3 ? 'Mild' : symptomSeverity <= 6 ? 'Moderate' : 'Severe'})
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={symptomSeverity}
                  onChange={(e) => setSymptomSeverity(Number(e.target.value))}
                  className="w-full accent-[#5a6344] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3a3530] mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={symptomLocation}
                  onChange={(e) => setSymptomLocation(e.target.value)}
                  placeholder="e.g. Frontal / Bilateral, Lumbar, Pelvic"
                  className="w-full px-3 py-2 bg-white border border-[#e8e4db] rounded-lg text-sm text-[#3a3530] focus:border-[#5a6344] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3a3530] mb-1">
                  Notes / Triggers
                </label>
                <textarea
                  rows={2}
                  value={symptomNotes}
                  onChange={(e) => setSymptomNotes(e.target.value)}
                  placeholder="Describe context, screen time, hydration, or relief factors..."
                  className="w-full px-3 py-2 bg-white border border-[#e8e4db] rounded-lg text-sm text-[#3a3530] focus:border-[#5a6344] focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="p-4 bg-[#f4f1eb] border-t border-[#e8e4db] flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#7d756d] hover:bg-[#e8e4db] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!symptomTitle.trim()}
                onClick={() => {
                  if (!symptomTitle.trim()) return;
                  onAddSymptom({
                    title: symptomTitle,
                    severity: symptomSeverity,
                    severityMax: 10,
                    severityLabel: symptomSeverity <= 3 ? 'Mild' : symptomSeverity <= 6 ? 'Moderate' : 'Severe',
                    location: symptomLocation,
                    onset: 'Just now',
                    status: 'active',
                    description: symptomNotes || 'Patient reported symptom episode.'
                  });
                  onAddLog({
                    category: 'symptoms',
                    title: `Symptom Logged: ${symptomTitle}`,
                    badge: `Severity ${symptomSeverity}/10`,
                    badgeType: 'rose',
                    description: symptomNotes || `Reported ${symptomLocation}`,
                    timestamp: 'Just now'
                  });
                  onClose();
                }}
                className="px-4 py-1.5 text-xs font-semibold text-[#fcf9f5] bg-[#5a6344] hover:bg-[#4a5237] disabled:opacity-50 rounded-lg shadow-xs transition-colors"
              >
                Record Symptom
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL: RECORD WEIGH-IN ================= */}
        {activeModal === 'record-weighin' && (
          <div className="flex flex-col">
            <div className="p-4 border-b border-[#e8e4db] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#5a6344]/10 text-[#5a6344] flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-headline text-base font-semibold text-[#3a3530]">
                    Record Weigh-In
                  </h3>
                  <p className="text-xs text-[#7d756d]">
                    Bio-impedance and body composition logging
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-[#7d756d] hover:text-[#3a3530]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 bg-[#fcf9f5]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3a3530] mb-1">
                    Body Weight (lbs)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e8e4db] rounded-lg text-sm text-[#3a3530] focus:border-[#5a6344] focus:outline-none"
                    placeholder="172.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3a3530] mb-1">
                    Body Fat (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={bodyFatInput}
                    onChange={(e) => setBodyFatInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e8e4db] rounded-lg text-sm text-[#3a3530] focus:border-[#5a6344] focus:outline-none"
                    placeholder="23.4"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#f4f1eb] rounded-xl text-xs space-y-1 text-[#6c655c]">
                <div className="flex justify-between">
                  <span>Current Target:</span>
                  <span className="font-bold text-[#3a3530]">{vitals.targetWeight} lbs</span>
                </div>
                <div className="flex justify-between">
                  <span>Calculated BMI:</span>
                  <span className="font-mono-data font-semibold text-[#5a6344]">
                    {((Number(weightInput) / (67 * 67)) * 703).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#f4f1eb] border-t border-[#e8e4db] flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#7d756d] hover:bg-[#e8e4db] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = Number(weightInput) || 172.5;
                  const fat = Number(bodyFatInput) || 23.4;
                  const bmiCalc = Number(((val / (67 * 67)) * 703).toFixed(1));
                  onUpdateVitals({
                    weight: val,
                    bodyFatPercent: fat,
                    bmi: bmiCalc
                  });
                  onAddLog({
                    category: 'vitals',
                    title: `Weight Logged: ${val} lbs`,
                    badge: '-1.5 lbs',
                    badgeType: 'cyan',
                    description: `Body Fat: ${fat}%, BMI: ${bmiCalc}`,
                    timestamp: 'Just now'
                  });
                  onClose();
                }}
                className="px-4 py-1.5 text-xs font-semibold text-[#fcf9f5] bg-[#5a6344] hover:bg-[#4a5237] rounded-lg shadow-xs transition-colors"
              >
                Save Weigh-In
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL: REQUEST REFILL ================= */}
        {activeModal === 'request-refill' && (
          <div className="flex flex-col">
            <div className="p-4 border-b border-[#e8e4db] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#b87a38]/15 text-[#b87a38] flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-headline text-base font-semibold text-[#3a3530]">
                    Request Prescription Refill
                  </h3>
                  <p className="text-xs text-[#7d756d]">
                    Authorized Electronic Transmission (e-Rx)
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-[#7d756d] hover:text-[#3a3530]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 bg-[#fcf9f5]">
              {refillSuccess ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#5a6344]/15 text-[#5a6344] flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-headline text-sm font-bold text-[#3a3530]">
                    Refill Order Submitted
                  </h4>
                  <p className="text-xs text-[#7d756d] max-w-xs mx-auto">
                    Sent to Walgreens #4812. Ready for pickup within 24–48 hours.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#3a3530] mb-1">
                      Select Medication
                    </label>
                    <select
                      value={refillRxId}
                      onChange={(e) => setRefillRxId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#e8e4db] rounded-lg text-xs font-medium text-[#3a3530] focus:outline-none"
                    >
                      {prescriptions.map((rx) => (
                        <option key={rx.id} value={rx.id}>
                          {rx.name} ({rx.pillsLeft !== undefined ? `${rx.pillsLeft} left` : rx.dosage})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-[#f4f1eb] p-3 rounded-xl space-y-1 text-xs text-[#6c655c]">
                    <div className="flex justify-between">
                      <span>Prescribing Physician:</span>
                      <span className="font-semibold text-[#3a3530]">Dr. Aris Thorne</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Designated Pharmacy:</span>
                      <span className="font-semibold text-[#3a3530]">Walgreens #4812</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Refill Quantity:</span>
                      <span className="font-semibold text-[#3a3530]">90 Day Supply (90 tablets)</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-[#f4f1eb] border-t border-[#e8e4db] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRefillSuccess(false);
                  onClose();
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#7d756d] hover:bg-[#e8e4db] rounded-lg transition-colors"
              >
                {refillSuccess ? 'Close' : 'Cancel'}
              </button>
              {!refillSuccess && (
                <button
                  type="button"
                  onClick={() => {
                    if (refillRxId) {
                      onRefillPrescription(refillRxId);
                      setRefillSuccess(true);
                      onAddLog({
                        category: 'medication',
                        title: 'Refill Authorized: Sent to Pharmacy',
                        badge: 'Walgreens #4812',
                        badgeType: 'emerald',
                        description: 'Electronic refill submitted via e-Rx integration.',
                        timestamp: 'Just now'
                      });
                    }
                  }}
                  className="px-4 py-1.5 text-xs font-semibold text-[#fcf9f5] bg-[#5a6344] hover:bg-[#4a5237] rounded-lg shadow-xs transition-colors"
                >
                  Confirm Refill Request
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================= MODAL: ADD PRESCRIPTION ================= */}
        {activeModal === 'add-prescription' && (
          <div className="flex flex-col">
            <div className="p-4 border-b border-[#e8e4db] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#5a6344]/10 text-[#5a6344] flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-headline text-base font-semibold text-[#3a3530]">
                    Add Prescription
                  </h3>
                  <p className="text-xs text-[#7d756d]">
                    Record maintenance, acute, or as-needed treatment
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-[#7d756d] hover:text-[#3a3530]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 bg-[#fcf9f5]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3a3530] mb-1">
                    Medication Name
                  </label>
                  <input
                    type="text"
                    value={newRxName}
                    onChange={(e) => setNewRxName(e.target.value)}
                    placeholder="e.g. Atorvastatin 20mg"
                    className="w-full px-3 py-2 bg-white border border-[#e8e4db] rounded-lg text-xs text-[#3a3530] focus:outline-none focus:border-[#5a6344]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3a3530] mb-1">
                    Regimen Type
                  </label>
                  <select
                    value={newRxType}
                    onChange={(e) => setNewRxType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#e8e4db] rounded-lg text-xs text-[#3a3530] focus:outline-none"
                  >
                    <option value="maintenance">Maintenance (Daily)</option>
                    <option value="acute">Acute / Temporary Course</option>
                    <option value="prn">As Needed (PRN)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3a3530] mb-1">
                  Instructions & Dosage
                </label>
                <input
                  type="text"
                  value={newRxInstructions}
                  onChange={(e) => setNewRxInstructions(e.target.value)}
                  placeholder="e.g. 1 tablet daily with evening meal"
                  className="w-full px-3 py-2 bg-white border border-[#e8e4db] rounded-lg text-xs text-[#3a3530] focus:outline-none focus:border-[#5a6344]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3a3530] mb-1">
                  Prescribing Physician
                </label>
                <input
                  type="text"
                  value={newRxPrescriber}
                  onChange={(e) => setNewRxPrescriber(e.target.value)}
                  placeholder="e.g. Dr. Aris Thorne"
                  className="w-full px-3 py-2 bg-white border border-[#e8e4db] rounded-lg text-xs text-[#3a3530] focus:outline-none focus:border-[#5a6344]"
                />
              </div>
            </div>

            <div className="p-4 bg-[#f4f1eb] border-t border-[#e8e4db] flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#7d756d] hover:bg-[#e8e4db] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newRxName.trim()}
                onClick={() => {
                  if (!newRxName.trim()) return;
                  onAddPrescription({
                    name: newRxName,
                    type: newRxType,
                    dosage: newRxDosage || 'Standard',
                    instructions: newRxInstructions,
                    scheduleTimes: ['Morning'],
                    prescriber: newRxPrescriber,
                    prescriberSpecialty: 'Primary Care',
                    pillsLeft: 30,
                    totalPills: 30,
                    refillDueText: 'Healthy Supply (30d)',
                    supplyDaysText: '30 pills left',
                    pillSupplyStatus: 'healthy',
                    status: 'active'
                  });
                  onAddLog({
                    category: 'medication',
                    title: `Prescription Added: ${newRxName}`,
                    badge: newRxType === 'maintenance' ? 'Maintenance' : 'Active Rx',
                    badgeType: 'emerald',
                    description: newRxInstructions,
                    timestamp: 'Just now'
                  });
                  onClose();
                }}
                className="px-4 py-1.5 text-xs font-semibold text-[#fcf9f5] bg-[#5a6344] hover:bg-[#4a5237] disabled:opacity-50 rounded-lg shadow-xs transition-colors"
              >
                Add Prescription
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL: NOTIFICATIONS ================= */}
        {activeModal === 'notifications' && (
          <div className="flex flex-col">
            <div className="p-4 border-b border-[#e8e4db] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#5a6344]/10 text-[#5a6344] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-headline text-base font-semibold text-[#3a3530]">
                    Patient Notifications
                  </h3>
                  <p className="text-xs text-[#7d756d]">
                    Clinical alerts, refill reminders, and telemetry sync
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-[#7d756d] hover:text-[#3a3530]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 divide-y divide-[#e8e4db] max-h-96 overflow-y-auto space-y-2 bg-[#fcf9f5]">
              <div className="p-2.5 rounded-xl bg-[#b87a38]/10 border border-[#b87a38]/20 flex items-start gap-3">
                <div className="p-1.5 bg-[#b87a38]/20 text-[#b87a38] rounded-lg shrink-0 mt-0.5">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#3a3530]">
                      Refill Due: Metformin 500mg
                    </span>
                    <span className="px-1.5 py-0.2 rounded font-mono-data text-[10px] bg-[#b87a38]/20 text-[#9e6b28] font-semibold">
                      24 pills left
                    </span>
                  </div>
                  <p className="text-xs text-[#6c655c] mt-0.5">
                    Supply estimate reaches 0 on Sep 18. Tap to request an authorized refill.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#f4f1eb] border border-[#e8e4db] flex items-start gap-3">
                <div className="p-1.5 bg-[#5a6344]/15 text-[#5a6344] rounded-lg shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#3a3530]">
                      Continuous Telemetry Sync Complete
                    </span>
                    <span className="px-1.5 py-0.2 rounded font-mono-data text-[10px] bg-[#5a6344]/15 text-[#5a6344] font-semibold">
                      Withings BPM
                    </span>
                  </div>
                  <p className="text-xs text-[#6c655c] mt-0.5">
                    Blood pressure reading 120/80 mmHg recorded. Status: Normotensive.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#f4f1eb] border-t border-[#e8e4db] flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold text-[#3a3530] hover:bg-[#e8e4db] rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
