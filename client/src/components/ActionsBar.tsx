import { useState } from 'react';
import html2canvas from 'html2canvas';
import { downloadDocx, downloadPdf, ApiError } from '../api/client';
import { useToast } from '../context/ToastContext';
import type { FacilityReportData, ManualInputs, ReportPayload } from '../types';

interface ActionsBarProps {
  facility: FacilityReportData;
  manual: ManualInputs;
}

async function captureChart(): Promise<string | undefined> {
  const el = document.getElementById('benchmark-capture');
  if (!el) return undefined;
  try {
    const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2, logging: false });
    return canvas.toDataURL('image/png');
  } catch {
    // Non-fatal: the server falls back to a pure-CSS chart in the export.
    return undefined;
  }
}

export function ActionsBar({ facility, manual }: ActionsBarProps) {
  const { notify } = useToast();
  const [busy, setBusy] = useState<null | 'pdf' | 'docx'>(null);

  const buildPayload = async (): Promise<ReportPayload> => ({
    facility,
    manual,
    chartImage: await captureChart(),
  });

  const handleDownload = async (kind: 'pdf' | 'docx') => {
    setBusy(kind);
    try {
      const payload = await buildPayload();
      if (kind === 'pdf') await downloadPdf(payload);
      else await downloadDocx(payload);
      notify('success', `${kind.toUpperCase()} report downloaded.`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Export failed. Please retry.';
      notify('error', message);
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(facility.careCompareUrl);
      notify('success', 'Medicare Care Compare link copied.');
    } catch {
      notify('error', 'Could not copy link.');
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={() => handleDownload('pdf')}
        disabled={busy !== null}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-primary-container disabled:opacity-60"
      >
        {busy === 'pdf' ? <Spinner /> : '⬇'} Export Audit Report (PDF)
      </button>
      <div className="flex gap-2">
        <button
          onClick={() => handleDownload('docx')}
          disabled={busy !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary bg-white px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
        >
          {busy === 'docx' ? <Spinner /> : '⬇'} Word
        </button>
        <button
          onClick={copyLink}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-semibold text-on-surface-variant transition hover:border-primary hover:text-primary"
        >
          🔗 Copy Link
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}
