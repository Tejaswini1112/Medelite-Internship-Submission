interface TopBarProps {
  onPrint: () => void;
  ccn?: string;
}

/**
 * Sticky workspace top bar. The platform brand "INFINITE — Managed by MEDELITE"
 * is hardcoded here and in the report canvas; it is never replaced by the
 * facility name (per the brief's branding guardrail).
 */
export function TopBar({ onPrint, ccn }: TopBarProps) {
  return (
    <header className="no-print sticky top-0 z-10 flex h-16 items-center justify-between border-b border-outline-variant bg-surface-bright px-6">
      <div className="flex flex-col">
        <span className="font-serif text-base font-bold tracking-tight text-primary">
          INFINITE — Managed by MEDELITE
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-label text-outline">
          Clinical Audit Dashboard v2.4
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onPrint}
          title="Print / Save as PDF"
          className="rounded-lg p-2 text-outline transition-colors hover:bg-surface-container hover:text-primary"
          aria-label="Print"
        >
          🖨
        </button>
        <div className="mx-1 h-8 w-px bg-outline-variant" />
        <div className="text-right">
          <p className="text-xs font-semibold text-on-surface">Dr. Sarah Miller</p>
          <p className="text-[10px] font-bold uppercase text-outline">
            Facility Administrator{ccn ? ` · CCN ${ccn}` : ''}
          </p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-full border border-outline-variant bg-primary/10 text-sm font-bold text-primary">
          SM
        </div>
      </div>
    </header>
  );
}
