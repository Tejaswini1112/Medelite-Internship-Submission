import type { ReportPayload } from '../types.js';
import {
  NOT_AVAILABLE,
  escapeHtml,
  formatMetricValue,
  formatTimestamp,
  manualValue,
  resolveFacilityName,
  variance,
} from './format.js';

/**
 * Single source-of-truth HTML template used by Puppeteer (PDF) and mirrored by
 * the React report canvas. Matches the "Clinical Minimalism / Report-First
 * Canvas" Stitch design (Merriweather headings, zebra tables, clinical advisory).
 */
export function renderReportHtml(payload: ReportPayload): string {
  const { facility, manual } = payload;
  const state = facility.address.state ?? '';
  const name = escapeHtml(resolveFacilityName(facility, manual));

  const stars = facility.starRatings;
  const starCards: Array<[string, number | null]> = [
    ['Overall', stars.overall],
    ['Health Insp.', stars.healthInspection],
    ['Staffing', stars.staffing],
    ['Quality', stars.qualityMeasures],
  ];

  const opRows: Array<[string, string]> = [
    ['EMR', manualValue(manual.emr)],
    ['Census Capacity', facility.certifiedBeds !== null ? String(facility.certifiedBeds) : NOT_AVAILABLE],
    ['Type of Patient', manualValue(manual.patientType)],
    ['Current Census', manualValue(manual.currentCensus)],
    ['Previous Coverage from Medelite', manualValue(manual.previousCoverage)],
    ['Previous Provider Performance', manualValue(manual.previousProviderPerformance)],
    ['Medical Coverage', manualValue(manual.medicalCoverage)],
    ['Avg Residents/Day (CMS)', facility.averageResidentsPerDay !== null ? String(facility.averageResidentsPerDay) : NOT_AVAILABLE],
  ];

  const advisories = facility.metrics.filter((m) => variance(m, 'national').favorable === false);
  const advisoryText =
    advisories.length === 0
      ? 'All hospitalization and ED utilization measures are at or below national benchmarks. No clinical escalation is indicated from this snapshot.'
      : `${advisories.map((m) => m.label).join(', ')} ${advisories.length === 1 ? 'is' : 'are'} currently above national benchmarks. Recommend clinical review of medication management and chronic condition monitoring protocols.`;

  const chartBlock = payload.chartImage
    ? `<img class="chart-img" src="${payload.chartImage}" alt="Facility vs State vs National benchmark chart" />`
    : renderCssBarChart(payload);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Facility Assessment Snapshot — ${name}</title>
<style>${styles()}</style>
</head>
<body>
  <article class="canvas">
    <!-- Print header (hardcoded brand; dynamic state + date) -->
    <header class="rpt-head">
      <div>
        <div class="brand-infinite">INFINITE</div>
        <div class="brand-managed">Managed by MEDELITE Clinical Systems</div>
      </div>
      <div class="head-right">
        <div class="snap-label">FACILITY ASSESSMENT SNAPSHOT${state ? ` &middot; ${escapeHtml(state)}` : ''}</div>
        <div class="snap-date">Date: ${escapeHtml(formatTimestamp(facility.generatedAt))}</div>
      </div>
    </header>

    <!-- Title -->
    <div class="title-block">
      <h1>Facility Assessment Report</h1>
      <p>A comprehensive summary of clinical performance, staffing metrics, and quality measures based on current CMS Care Compare data and internal audits.</p>
    </div>

    ${facility.partial ? `<div class="warn">${facility.warnings.map((w) => escapeHtml(w)).join(' ')}</div>` : ''}

    <!-- Identification + quick stats -->
    <section class="grid2">
      <div>
        <p class="sec-label">Facility Identification</p>
        <div class="id-card">
          <h2>${name}</h2>
          <p class="muted">${escapeHtml(facility.address.full ?? NOT_AVAILABLE)}</p>
          <p class="ccn">CCN: <span>${escapeHtml(facility.ccn)}</span></p>
        </div>
      </div>
      <div>
        <p class="sec-label">Quick Stats</p>
        <div class="stats">
          <div class="stat"><span class="num">${facility.certifiedBeds ?? '—'}</span><span class="cap">Total Beds</span></div>
          <div class="stat"><span class="num">${escapeHtml(manualValue(manual.currentCensus, facility.averageResidentsPerDay?.toString() ?? '—'))}</span><span class="cap">Curr. Residents</span></div>
        </div>
      </div>
    </section>

    <!-- Operational profile -->
    <section>
      <p class="sec-label">Operational Profile</p>
      <div class="op-grid">
        ${opRows.map(([k, v]) => `<div class="op-row"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`).join('')}
      </div>
    </section>

    <!-- Star ratings -->
    <section>
      <p class="sec-label">CMS Star Ratings</p>
      <div class="stars-grid">
        ${starCards
          .map(
            ([label, value]) => `<div class="star-card">
              <div class="star-cap">${escapeHtml(label)}</div>
              <div class="star-glyphs">${renderStarGlyphs(value)}</div>
              <div class="star-num">${value === null ? 'N/A' : `${value} Star${value === 1 ? '' : 's'}`}</div>
            </div>`,
          )
          .join('')}
      </div>
    </section>

    <!-- Hospitalization & ER utilization -->
    <section>
      <p class="sec-label">Hospitalization &amp; ER Utilization</p>
      <table class="metrics">
        <thead>
          <tr>
            <th class="left">Clinical Measure</th>
            <th>Facility</th>
            <th class="teal">State Avg</th>
            <th class="teal">Nat. Avg</th>
          </tr>
        </thead>
        <tbody>
          ${facility.metrics
            .map((m, i) => {
              const critical = variance(m, 'national').favorable === false;
              const facCls = m.facility === null ? 'na' : critical ? 'critical' : 'fac';
              const facVal = m.facility === null ? 'N/A' : formatMetricValue(m.facility, m.unit);
              return `<tr class="${i % 2 === 1 ? 'zebra' : ''}">
                <td class="left">${escapeHtml(m.label)}</td>
                <td class="${facCls}">${facVal}</td>
                <td class="muted">${formatMetricValue(m.stateAverage, m.unit)}</td>
                <td class="muted">${formatMetricValue(m.nationalAverage, m.unit)}</td>
              </tr>`;
            })
            .join('')}
        </tbody>
      </table>
      <div class="advisory"><strong>CLINICAL ADVISORY:</strong> ${escapeHtml(advisoryText)}</div>
    </section>

    <!-- Benchmark visualization -->
    <section>
      <p class="sec-label">Benchmark Visualization — Facility vs State vs National</p>
      ${chartBlock}
    </section>

    <!-- Footer -->
    <footer class="rpt-foot">
      <div class="legal">
        <p class="legal-label">CMS Legal Designation</p>
        <p>${escapeHtml(facility.providerName)} is a certified nursing facility compliant with federal regulations under CMS Medicare and Medicaid protocols. Source: CMS Provider Data Catalog (Care Compare)${facility.cmsProcessingDate ? `, processed ${escapeHtml(facility.cmsProcessingDate)}` : ''}${facility.measurePeriod ? ` &middot; claims period ${escapeHtml(facility.measurePeriod)}` : ''}.</p>
      </div>
      <div class="foot-right">
        <a href="${facility.careCompareUrl}">View on Medicare.gov &#8599;</a>
        <p class="copy">&copy; ${new Date().getFullYear()} MEDELITE Clinical Systems. All Rights Reserved.</p>
      </div>
    </footer>
  </article>
</body>
</html>`;
}

function renderStarGlyphs(value: number | null): string {
  if (value === null) return '<span class="off">&#9734;&#9734;&#9734;&#9734;&#9734;</span>';
  let out = '';
  for (let i = 1; i <= 5; i += 1) {
    out += `<span class="${i <= value ? 'on' : 'off'}">${i <= value ? '&#9733;' : '&#9734;'}</span>`;
  }
  return out;
}

/** Pure HTML/CSS grouped bar chart so PDFs render without JS or external assets. */
function renderCssBarChart(payload: ReportPayload): string {
  const metrics = payload.facility.metrics;
  const groups = metrics
    .map((m) => {
      const values = [m.facility, m.stateAverage, m.nationalAverage];
      const max = Math.max(...values.filter((v): v is number => v !== null), 0.0001);
      const bar = (v: number | null, cls: string, label: string) => {
        if (v === null) return `<div class="bar empty" title="${label}: N/A"></div>`;
        const h = Math.max(4, Math.round((v / max) * 100));
        return `<div class="bar ${cls}" style="height:${h}%" title="${label}: ${v}"><span>${formatMetricValue(v, m.unit)}</span></div>`;
      };
      return `<div class="chart-group">
        <div class="bars">
          ${bar(m.facility, 'b-facility', 'Facility')}
          ${bar(m.stateAverage, 'b-state', 'State')}
          ${bar(m.nationalAverage, 'b-national', 'National')}
        </div>
        <div class="chart-label">${escapeHtml(m.label)}</div>
      </div>`;
    })
    .join('');

  return `<div class="chart">
    <div class="chart-legend">
      <span><i class="b-facility"></i> Facility</span>
      <span><i class="b-state"></i> State Avg</span>
      <span><i class="b-national"></i> National Avg</span>
    </div>
    <div class="chart-groups">${groups}</div>
  </div>`;
}

function styles(): string {
  return `
  * { box-sizing: border-box; }
  :root {
    --primary: #003c90;
    --primary-2: #0f52ba;
    --ink: #0b1c30;
    --muted: #737784;
    --line: #c3c6d5;
    --zebra: #f1f5f9;
    --surface: #f8f9ff;
    --teal: #006a61;
    --err-bg: #ffdad6;
    --err-fg: #93000a;
  }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: var(--ink);
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-variant-numeric: tabular-nums;
  }
  .serif { font-family: Georgia, 'Times New Roman', serif; }
  .canvas { width: 720px; margin: 0 auto; padding: 8px 0 24px; }
  section { margin-bottom: 24px; }
  .sec-label { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); font-weight: 600; margin: 0 0 8px; }

  .rpt-head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--primary); padding-bottom: 14px; margin-bottom: 20px; }
  .brand-infinite { font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: var(--primary); }
  .brand-managed { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--line); font-weight: 600; }
  .head-right { text-align: right; }
  .snap-label { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; color: var(--ink); }
  .snap-date { font-size: 12px; color: var(--muted); }

  .title-block h1 { font-family: Georgia, serif; font-size: 30px; font-weight: 700; letter-spacing: -.02em; margin: 0 0 4px; color: var(--ink); }
  .title-block p { font-size: 13px; color: #434653; margin: 0 0 24px; }

  .warn { font-size: 12px; color: #92400e; background: #fef3c7; border: 1px solid rgba(146,64,14,.3); border-radius: 6px; padding: 8px 12px; margin-bottom: 20px; }

  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .id-card { border: 1px solid var(--line); background: var(--surface); border-radius: 6px; padding: 14px; }
  .id-card h2 { font-family: Georgia, serif; font-size: 17px; font-weight: 700; color: var(--primary); margin: 0 0 4px; }
  .id-card .muted { font-size: 13px; color: #434653; margin: 0; }
  .id-card .ccn { font-size: 13px; font-weight: 700; margin: 8px 0 0; }
  .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .stat { border: 1px solid var(--line); border-radius: 6px; padding: 12px; text-align: center; }
  .stat .num { display: block; font-size: 24px; font-weight: 700; color: var(--primary); }
  .stat .cap { font-size: 10px; text-transform: uppercase; font-weight: 600; color: var(--muted); }

  .op-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 32px; border: 1px solid var(--line); background: var(--surface); border-radius: 6px; padding: 4px 16px; }
  .op-row { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px solid var(--zebra); font-size: 13px; }
  .op-row span { color: #434653; }
  .op-row strong { color: var(--ink); font-weight: 600; text-align: right; }

  .stars-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .star-card { border: 1px solid var(--line); background: var(--surface); border-radius: 6px; padding: 10px; text-align: center; }
  .star-cap { font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--muted); margin-bottom: 4px; }
  .star-glyphs { font-size: 15px; letter-spacing: 1px; }
  .star-glyphs .on { color: var(--primary); }
  .star-glyphs .off { color: var(--line); }
  .star-num { font-size: 12px; font-weight: 600; margin-top: 4px; }

  table.metrics { width: 100%; border-collapse: collapse; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; }
  table.metrics th { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #434653; padding: 8px; background: #dce9ff; text-align: center; }
  table.metrics th.left { text-align: left; }
  table.metrics th.teal { color: var(--teal); }
  table.metrics td { font-size: 13px; padding: 8px; text-align: center; border-bottom: 1px solid var(--zebra); }
  table.metrics td.left { text-align: left; color: var(--ink); }
  table.metrics tr.zebra { background: var(--zebra); }
  table.metrics td.fac { font-weight: 700; color: var(--primary); }
  table.metrics td.critical { font-weight: 700; background: var(--err-bg); color: var(--err-fg); }
  table.metrics td.na { font-weight: 700; color: var(--muted); }
  table.metrics td.muted { color: var(--muted); }
  .advisory { margin-top: 14px; padding: 12px 14px; background: #eff4ff; border-left: 4px solid var(--primary); border-radius: 0 6px 6px 0; font-size: 13px; }
  .advisory strong { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }

  .chart { padding: 6px 2px; }
  .chart-img { width: 100%; height: auto; border: 1px solid var(--line); border-radius: 6px; }
  .chart-legend { display: flex; gap: 18px; font-size: 12px; color: var(--muted); margin-bottom: 12px; }
  .chart-legend i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; vertical-align: -1px; margin-right: 5px; }
  .chart-groups { display: flex; gap: 18px; align-items: flex-end; }
  .chart-group { flex: 1; text-align: center; }
  .bars { display: flex; gap: 5px; align-items: flex-end; height: 120px; justify-content: center; }
  .bar { width: 24px; border-radius: 4px 4px 0 0; position: relative; }
  .bar span { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); font-size: 9px; color: var(--muted); white-space: nowrap; }
  .bar.empty { background: repeating-linear-gradient(45deg,#eef1f7,#eef1f7 4px,#fff 4px,#fff 8px); height: 6px; }
  .b-facility { background: var(--primary); }
  .b-state { background: var(--teal); }
  .b-national { background: #86f2e4; }
  i.b-facility, i.b-state, i.b-national { display: inline-block; }
  .chart-label { font-size: 10px; color: var(--muted); margin-top: 8px; }

  .rpt-foot { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid var(--line); padding-top: 14px; margin-top: 8px; }
  .legal { max-width: 60%; }
  .legal-label { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: var(--line); font-weight: 600; margin: 0 0 4px; }
  .legal p { font-size: 11px; color: #434653; margin: 0; }
  .foot-right { text-align: right; }
  .foot-right a { font-size: 13px; font-weight: 600; color: var(--primary); text-decoration: none; }
  .foot-right .copy { font-size: 10px; color: var(--muted); margin: 4px 0 0; }

  @page { size: A4; margin: 14mm; }
  `;
}
