import { forwardRef } from 'react';
import type { FacilityReportData, ManualInputs } from '../types';
import {
  NOT_AVAILABLE,
  formatMetricValue,
  formatTimestamp,
  manualValue,
  resolveFacilityName,
  variance,
} from '../lib/format';
import { StarRating } from './StarRating';
import { BenchmarkChart } from './BenchmarkChart';

interface ReportCanvasProps {
  facility: FacilityReportData;
  manual: ManualInputs;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[12px] font-semibold uppercase tracking-label text-outline">{children}</p>
  );
}

function OpRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-zebra py-1.5 last:border-0">
      <span className="text-[13px] text-on-surface-variant">{label}</span>
      <span className="text-right text-[13px] font-medium text-on-surface">{value}</span>
    </div>
  );
}

export const ReportCanvas = forwardRef<HTMLElement, ReportCanvasProps>(function ReportCanvas(
  { facility, manual },
  ref,
) {
  const name = resolveFacilityName(facility, manual);
  const state = facility.address.state ?? '';
  const stars = facility.starRatings;

  const advisories = facility.metrics.filter((m) => {
    const v = variance(m, 'national');
    return v.favorable === false;
  });

  return (
    <article
      ref={ref}
      className="report-canvas relative flex min-h-[1056px] w-full max-w-report flex-col bg-white p-12 shadow-canvas ring-1 ring-outline-variant"
    >
      {/* Print header — hardcoded brand, dynamic state + date */}
      <div className="mb-6 flex items-start justify-between border-b-2 border-primary pb-4">
        <div>
          <p className="font-serif text-2xl font-bold text-primary">INFINITE</p>
          <p className="text-[12px] font-semibold uppercase tracking-label text-outline-variant">
            Managed by MEDELITE Clinical Systems
          </p>
        </div>
        <div className="text-right">
          <p className="text-[12px] font-semibold uppercase tracking-label text-on-surface">
            Facility Assessment Snapshot{state ? ` · ${state}` : ''}
          </p>
          <p className="text-[13px] text-outline">Date: {formatTimestamp(facility.generatedAt)}</p>
        </div>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="mb-1 font-serif text-3xl font-bold tracking-tight text-on-surface">
          Facility Assessment Report
        </h1>
        <p className="text-[14px] text-on-surface-variant">
          A comprehensive summary of clinical performance, staffing metrics, and quality measures
          based on current CMS Care Compare data and internal audits.
        </p>
      </div>

      {facility.partial && (
        <div className="mb-6 rounded border border-amber-deep/30 bg-amber-soft px-3 py-2 text-xs text-amber-deep">
          {facility.warnings.join(' ')}
        </div>
      )}

      {/* Facility identification + quick stats */}
      <section className="mb-8 grid grid-cols-2 gap-5">
        <div>
          <SectionLabel>Facility Identification</SectionLabel>
          <div className="rounded border border-outline-variant bg-surface-bright p-4">
            <h2 className="mb-1 font-serif text-lg font-bold text-primary">{name}</h2>
            <p className="text-[13px] text-on-surface-variant">
              {facility.address.full ?? NOT_AVAILABLE}
            </p>
            <p className="mt-2 text-[13px] font-bold text-on-surface">
              CCN: <span className="tnum">{facility.ccn}</span>
            </p>
          </div>
        </div>
        <div>
          <SectionLabel>Quick Stats</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-outline-variant p-3 text-center">
              <span className="block text-2xl font-bold text-primary tnum">
                {facility.certifiedBeds ?? '—'}
              </span>
              <span className="text-[10px] font-semibold uppercase text-outline">Total Beds</span>
            </div>
            <div className="rounded border border-outline-variant p-3 text-center">
              <span className="block text-2xl font-bold text-primary tnum">
                {manualValue(manual.currentCensus, facility.averageResidentsPerDay?.toString() ?? '—')}
              </span>
              <span className="text-[10px] font-semibold uppercase text-outline">Curr. Residents</span>
            </div>
          </div>
        </div>
      </section>

      {/* Operational profile (all remaining brief fields) */}
      <section className="mb-8">
        <SectionLabel>Operational Profile</SectionLabel>
        <div className="grid grid-cols-2 gap-x-8 rounded border border-outline-variant bg-surface-bright px-4 py-2">
          <OpRow label="EMR" value={manualValue(manual.emr)} />
          <OpRow label="Census Capacity" value={facility.certifiedBeds?.toString() ?? NOT_AVAILABLE} />
          <OpRow label="Type of Patient" value={manualValue(manual.patientType)} />
          <OpRow label="Current Census" value={manualValue(manual.currentCensus)} />
          <OpRow label="Previous Coverage from Medelite" value={manualValue(manual.previousCoverage)} />
          <OpRow
            label="Previous Provider Performance"
            value={manualValue(manual.previousProviderPerformance)}
          />
          <OpRow label="Medical Coverage" value={manualValue(manual.medicalCoverage)} />
          <OpRow
            label="Avg Residents/Day (CMS)"
            value={facility.averageResidentsPerDay?.toString() ?? NOT_AVAILABLE}
          />
        </div>
      </section>

      {/* CMS Star Ratings */}
      <section className="mb-8">
        <SectionLabel>CMS Star Ratings</SectionLabel>
        <div className="grid grid-cols-4 gap-3">
          <StarRating label="Overall" value={stars.overall} />
          <StarRating label="Health Insp." value={stars.healthInspection} />
          <StarRating label="Staffing" value={stars.staffing} />
          <StarRating label="Quality" value={stars.qualityMeasures} />
        </div>
      </section>

      {/* Hospitalization & ER utilization */}
      <section className="mb-8">
        <SectionLabel>Hospitalization &amp; ER Utilization</SectionLabel>
        <div className="overflow-hidden rounded border border-outline-variant">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-outline-variant bg-surface-high">
              <tr>
                <th className="p-2 text-[12px] font-semibold uppercase tracking-label text-on-surface-variant">
                  Clinical Measure
                </th>
                <th className="p-2 text-center text-[12px] font-semibold uppercase tracking-label text-on-surface-variant">
                  Facility
                </th>
                <th className="p-2 text-center text-[12px] font-semibold uppercase tracking-label text-secondary">
                  State Avg
                </th>
                <th className="p-2 text-center text-[12px] font-semibold uppercase tracking-label text-secondary">
                  Nat. Avg
                </th>
              </tr>
            </thead>
            <tbody className="tnum">
              {facility.metrics.map((m, i) => {
                const v = variance(m, 'national');
                const critical = v.favorable === false;
                return (
                  <tr
                    key={m.key}
                    className={`border-b border-zebra last:border-0 ${i % 2 === 1 ? 'bg-zebra' : ''}`}
                  >
                    <td className="p-2 text-on-surface">
                      {m.label}
                      {m.footnote && (
                        <span className="ml-1 cursor-help text-outline" title={m.footnote}>
                          ⓘ
                        </span>
                      )}
                    </td>
                    <td
                      className={`p-2 text-center font-bold ${
                        m.facility === null
                          ? 'text-outline'
                          : critical
                            ? 'bg-error-container text-on-error-container'
                            : 'text-primary'
                      }`}
                    >
                      {m.facility === null ? (
                        <span className="cursor-help" title="CMS did not report a value for this measure.">
                          N/A
                        </span>
                      ) : (
                        formatMetricValue(m.facility, m.unit)
                      )}
                    </td>
                    <td className="p-2 text-center text-outline">
                      {formatMetricValue(m.stateAverage, m.unit)}
                    </td>
                    <td className="p-2 text-center text-outline">
                      {formatMetricValue(m.nationalAverage, m.unit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Clinical advisory */}
        <div className="mt-4 rounded border-l-4 border-primary bg-surface-low p-4">
          <p className="text-[13px] text-on-surface">
            <strong className="text-[12px] font-semibold uppercase tracking-label">
              Clinical Advisory:{' '}
            </strong>
            {advisories.length === 0
              ? 'All hospitalization and ED utilization measures are at or below national benchmarks. No clinical escalation is indicated from this snapshot.'
              : `${advisories
                  .map((m) => m.label)
                  .join(', ')} ${advisories.length === 1 ? 'is' : 'are'} currently above national benchmarks. Recommend clinical review of medication management and chronic condition monitoring protocols.`}
          </p>
        </div>
      </section>

      {/* Benchmark visualization */}
      <section className="mb-8">
        <SectionLabel>Benchmark Visualization — Facility vs State vs National</SectionLabel>
        <div id="benchmark-capture" className="rounded border border-outline-variant bg-white p-3">
          <BenchmarkChart metrics={facility.metrics} />
        </div>
      </section>

      {/* Footer legal area */}
      <footer className="mt-auto flex items-end justify-between border-t border-outline-variant pt-4">
        <div className="max-w-md">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-label text-outline-variant">
            CMS Legal Designation
          </p>
          <p className="text-[12px] text-on-surface-variant">
            {facility.providerName} is a certified nursing facility compliant with federal
            regulations under CMS Medicare and Medicaid protocols. Data source: CMS Provider Data
            Catalog (Care Compare)
            {facility.cmsProcessingDate ? `, processed ${facility.cmsProcessingDate}` : ''}
            {facility.measurePeriod ? ` · claims period ${facility.measurePeriod}` : ''}.
          </p>
        </div>
        <div className="text-right">
          <a
            className="flex items-center justify-end gap-1 text-[13px] font-semibold text-primary hover:underline"
            href={facility.careCompareUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Medicare.gov ↗
          </a>
          <p className="mt-1 text-[10px] text-outline">
            © {new Date().getFullYear()} MEDELITE Clinical Systems. All Rights Reserved.
          </p>
        </div>
      </footer>

      {/* Watermark */}
      <div className="no-print pointer-events-none absolute right-10 top-28 select-none text-[120px] leading-none text-primary/10">
        ✓
      </div>
    </article>
  );
});
