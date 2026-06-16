import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { ReportPayload } from '../types.js';
import {
  NOT_AVAILABLE,
  formatMetricValue,
  formatStars,
  formatTimestamp,
  manualValue,
  resolveFacilityName,
  variance,
} from './format.js';

const INK = '0B1C30';
const PRIMARY = '003C90';
const MUTED = '737784';
const GOOD = '15803D';
const BAD = 'B91C1C';

function kvRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 42, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F8F9FF' },
        children: [
          new Paragraph({ children: [new TextRun({ text: label, bold: true, color: MUTED, size: 20 })] }),
        ],
      }),
      new TableCell({
        width: { size: 58, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, color: INK })] })],
      }),
    ],
  });
}

function headerCell(text: string): TableCell {
  return new TableCell({
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: PRIMARY },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 18 })],
      }),
    ],
  });
}

function cell(
  text: string,
  opts: { bold?: boolean; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {},
): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.CENTER,
        children: [new TextRun({ text, bold: opts.bold, color: opts.color ?? INK, size: 19 })],
      }),
    ],
  });
}

export async function generateDocx(payload: ReportPayload): Promise<Buffer> {
  const { facility, manual } = payload;
  const state = facility.address.state ?? '';
  const name = resolveFacilityName(facility, manual);

  const snapshotRows: Array<[string, string]> = [
    ['Name of Facility', name],
    ['Location', facility.address.full ?? NOT_AVAILABLE],
    ['EMR', manualValue(manual.emr)],
    ['Census Capacity', facility.certifiedBeds !== null ? String(facility.certifiedBeds) : NOT_AVAILABLE],
    ['Current Census', manualValue(manual.currentCensus)],
    ['Type of Patient', manualValue(manual.patientType)],
    ['Previous Coverage from Medelite', manualValue(manual.previousCoverage)],
    ['Previous Provider Performance from Medelite', manualValue(manual.previousProviderPerformance)],
    ['Medical Coverage', manualValue(manual.medicalCoverage)],
  ];

  const fullWidth = { size: 100, type: WidthType.PERCENTAGE } as const;
  const noBorders = {
    top: { style: BorderStyle.SINGLE, size: 2, color: 'E6EAF2' },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E6EAF2' },
    left: { style: BorderStyle.SINGLE, size: 2, color: 'E6EAF2' },
    right: { style: BorderStyle.SINGLE, size: 2, color: 'E6EAF2' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E6EAF2' },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'E6EAF2' },
  };

  const stars = facility.starRatings;

  const metricsHeader = new TableRow({
    children: [
      headerCell('Metric'),
      headerCell('Facility'),
      headerCell('State Avg'),
      headerCell('National Avg'),
      headerCell('vs National'),
    ],
  });

  const metricRows = facility.metrics.map((m) => {
    const v = variance(m, 'national');
    const color = v.favorable === null ? INK : v.favorable ? GOOD : BAD;
    const arrow = v.favorable === null ? '' : v.favorable ? ' \u2193' : ' \u2191';
    return new TableRow({
      children: [
        cell(m.label, { align: AlignmentType.LEFT }),
        cell(formatMetricValue(m.facility, m.unit), { bold: true, color: PRIMARY }),
        cell(formatMetricValue(m.stateAverage, m.unit)),
        cell(formatMetricValue(m.nationalAverage, m.unit)),
        cell(`${v.text}${arrow}`, { bold: true, color }),
      ],
    });
  });

  const sectionTitle = (text: string) =>
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: text.toUpperCase(), bold: true, color: PRIMARY, size: 22 })],
    });

  const doc = new Document({
    creator: 'INFINITE — Managed by MEDELITE',
    title: `Facility Assessment Snapshot — ${name}`,
    sections: [
      {
        properties: {},
        children: [
          // Brand header (hardcoded — never the facility name)
          new Paragraph({
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: INK },
            spacing: { after: 0 },
            children: [
              new TextRun({ text: 'INFINITE ', bold: true, color: 'FFFFFF', size: 22 }),
              new TextRun({ text: '— Managed by ', color: 'BCD3FF', size: 20 }),
              new TextRun({ text: 'MEDELITE', bold: true, color: 'BCD3FF', size: 22 }),
            ],
          }),
          new Paragraph({
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: PRIMARY },
            spacing: { after: 240 },
            children: [
              new TextRun({ text: 'FACILITY ASSESSMENT SNAPSHOT  ', bold: true, color: 'FFFFFF', size: 30 }),
              new TextRun({ text: state, bold: true, color: 'FFFFFF', size: 30 }),
            ],
          }),

          sectionTitle('Facility Overview'),
          new Table({ width: fullWidth, borders: noBorders, rows: snapshotRows.map(([k, v]) => kvRow(k, v)) }),

          sectionTitle('CMS Quality Star Ratings'),
          new Table({
            width: fullWidth,
            borders: noBorders,
            rows: [
              kvRow('Overall Star Rating', formatStars(stars.overall)),
              kvRow('Health Inspection', formatStars(stars.healthInspection)),
              kvRow('Staffing', formatStars(stars.staffing)),
              kvRow('Quality of Resident Care', formatStars(stars.qualityMeasures)),
            ],
          }),

          sectionTitle('Hospitalization & ED Benchmarks'),
          new Table({ width: fullWidth, borders: noBorders, rows: [metricsHeader, ...metricRows] }),
          new Paragraph({
            spacing: { before: 80 },
            children: [
              new TextRun({
                text: 'Lower values are better. Short-Stay figures are percentages; Long-Stay figures are events per 1,000 resident days.',
                italics: true,
                color: MUTED,
                size: 16,
              }),
            ],
          }),

          sectionTitle('Verify on Medicare Care Compare'),
          new Paragraph({
            children: [
              new ExternalHyperlink({
                link: facility.careCompareUrl,
                children: [
                  new TextRun({ text: facility.careCompareUrl, style: 'Hyperlink', size: 18, color: '0F52BA', underline: {} }),
                ],
              }),
            ],
          }),

          new Paragraph({
            spacing: { before: 320 },
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'D8DCE6', space: 8 } },
            children: [
              new TextRun({
                text: `Generated ${formatTimestamp(facility.generatedAt)} · Source: CMS Provider Data Catalog (Care Compare)${facility.cmsProcessingDate ? ` · CMS data as of ${facility.cmsProcessingDate}` : ''}${facility.measurePeriod ? ` · Claims period ${facility.measurePeriod}` : ''}`,
                color: MUTED,
                size: 15,
              }),
            ],
          }),
          ...(facility.partial
            ? [
                new Paragraph({
                  children: [new TextRun({ text: `Note: ${facility.warnings.join(' ')}`, color: BAD, size: 15 })],
                }),
              ]
            : []),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
