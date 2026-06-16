import { useEffect, useState, type FormEvent } from 'react';
import { useForm } from '../context/FormContext';
import type { FacilityReportData, ManualInputs } from '../types';
import { ActionsBar } from './ActionsBar';

interface ControlsSidebarProps {
  facility?: FacilityReportData;
  isFetching: boolean;
}

const labelCls = 'text-[12px] font-semibold uppercase tracking-label text-on-surface-variant';
const inputCls =
  'w-full rounded-lg border border-outline-variant bg-surface-bright px-3 py-2 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30';

const PATIENT_TYPES = [
  'Long-term & Short-term',
  'Short-term Rehab',
  'Long-Term Care',
  'Post-Acute Rehab',
  'Specialized Memory Care',
  'Mixed Population',
];

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <label htmlFor={id} className="relative inline-flex cursor-pointer items-center">
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="h-6 w-11 rounded-full bg-outline-variant transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full" />
    </label>
  );
}

export function ControlsSidebar({ facility, isFetching }: ControlsSidebarProps) {
  const { activeCcn, setActiveCcn, manual, setManualField } = useForm();
  const [ccnInput, setCcnInput] = useState(activeCcn);
  const [error, setError] = useState<string | null>(null);
  const [overrideOn, setOverrideOn] = useState(false);

  // Keep the toggle in sync if the override is set elsewhere.
  useEffect(() => {
    if (manual.facilityNameOverride.trim()) setOverrideOn(true);
  }, [manual.facilityNameOverride]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const digits = ccnInput.trim().replace(/\D/g, '');
    if (digits.length === 0) return setError('Enter a CCN to look up.');
    if (digits.length > 6) return setError('A CCN is at most 6 digits.');
    setError(null);
    const padded = digits.padStart(6, '0');
    setCcnInput(padded);
    setActiveCcn(padded);
  };

  const setField = <K extends keyof ManualInputs>(k: K, v: ManualInputs[K]) => setManualField(k, v);

  return (
    <aside className="no-print fixed left-0 top-0 z-20 flex h-screen w-80 flex-col border-r border-outline-variant bg-surface-low">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-outline-variant p-4">
        <span className="text-primary">⚙</span>
        <h2 className="font-serif text-lg font-bold text-primary">Facility Controls</h2>
      </div>

      {/* Scrollable controls */}
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* CCN lookup */}
        <form onSubmit={submit} className="space-y-2" noValidate>
          <label className={labelCls}>CCN Lookup</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline">🔍</span>
            <input
              className={`${inputCls} pl-9 ${error ? 'border-bad ring-2 ring-bad/20' : ''}`}
              placeholder="Enter 6-digit CCN"
              inputMode="numeric"
              maxLength={6}
              value={ccnInput}
              onChange={(e) => setCcnInput(e.target.value)}
              aria-invalid={!!error}
            />
          </div>
          {error && <p className="text-xs font-medium text-bad">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isFetching}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-container disabled:opacity-60"
            >
              {isFetching ? 'Loading…' : 'Fetch Data'}
            </button>
            {['686123'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setCcnInput(s);
                  setError(null);
                  setActiveCcn(s);
                }}
                className="rounded-lg border border-outline-variant px-3 py-2 text-xs text-on-surface-variant transition hover:border-primary hover:text-primary"
              >
                Try {s}
              </button>
            ))}
          </div>
        </form>

        {/* Manual configuration */}
        <section className="space-y-4">
          <h3 className={`${labelCls} border-b border-outline-variant pb-1`}>Manual Configuration</h3>

          <div className="space-y-2">
            <label className={labelCls}>EMR System</label>
            <input
              className={inputCls}
              placeholder="PointClickCare, MatrixCare…"
              value={manual.emr}
              onChange={(e) => setField('emr', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Current Census</label>
            <input
              className={inputCls}
              type="number"
              placeholder="e.g. 112"
              value={manual.currentCensus}
              onChange={(e) => setField('currentCensus', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Patient Type</label>
            <select
              className={inputCls}
              value={manual.patientType}
              onChange={(e) => setField('patientType', e.target.value)}
            >
              <option value="">Select…</option>
              {PATIENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between py-1">
            <label className={labelCls}>Previous Coverage</label>
            <Toggle
              id="prevCoverage"
              checked={manual.previousCoverage === 'Yes'}
              onChange={(v) => setField('previousCoverage', v ? 'Yes' : 'No')}
            />
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Provider Performance Notes</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="e.g. About 30 patients/day"
              value={manual.previousProviderPerformance}
              onChange={(e) => setField('previousProviderPerformance', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Medical Coverage</label>
            <input
              className={inputCls}
              placeholder="Optometry, PCP, Podiatry…"
              value={manual.medicalCoverage}
              onChange={(e) => setField('medicalCoverage', e.target.value)}
            />
          </div>
        </section>

        {/* Name override */}
        <section className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <label className={labelCls}>Custom Facility Name</label>
            <Toggle
              id="nameOverride"
              checked={overrideOn}
              onChange={(v) => {
                setOverrideOn(v);
                if (!v) setField('facilityNameOverride', '');
              }}
            />
          </div>
          {overrideOn && (
            <div className="space-y-2">
              <input
                className={inputCls}
                placeholder="Enter custom name"
                value={manual.facilityNameOverride}
                onChange={(e) => setField('facilityNameOverride', e.target.value)}
              />
              {facility && (
                <div className="flex items-start gap-1 rounded bg-surface-high px-2 py-1">
                  <span className="text-outline">ⓘ</span>
                  <span className="text-[10px] font-bold uppercase leading-tight tracking-tight text-on-surface-variant">
                    Legal: {facility.providerName}
                  </span>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Export actions */}
      <div className="border-t border-outline-variant bg-surface-lowest p-4">
        {facility ? (
          <ActionsBar facility={facility} manual={manual} />
        ) : (
          <p className="text-center text-xs text-outline">Fetch a facility to enable exports.</p>
        )}
      </div>
    </aside>
  );
}
