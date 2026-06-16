import type { ApiError } from '../api/client';

export function CanvasSkeleton() {
  return (
    <div className="w-full max-w-report space-y-4 rounded bg-white p-12 shadow-canvas ring-1 ring-outline-variant">
      <div className="skeleton h-16 w-full" />
      <div className="skeleton h-10 w-2/3" />
      <div className="grid grid-cols-2 gap-5">
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-20" />
        ))}
      </div>
      <div className="skeleton h-48 w-full" />
      <div className="skeleton h-56 w-full" />
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="grid w-full max-w-report place-items-center rounded-lg border-2 border-dashed border-outline-variant bg-white/60 py-24 text-center">
      <div className="max-w-sm space-y-3 px-6">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-2xl text-primary">
          🔍
        </div>
        <h2 className="font-serif text-xl font-bold text-on-surface">Start with a CCN</h2>
        <p className="text-sm text-on-surface-variant">
          Enter a 6-digit CMS Certification Number in the controls to pull live Care Compare data and
          build a branded assessment snapshot. Try <strong>686123</strong> (Kendall Lakes).
        </p>
      </div>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  const isNotFound = error.code === 'NOT_FOUND' || error.status === 404;
  return (
    <div className="grid w-full max-w-report place-items-center rounded-lg border border-bad/30 bg-error-container/40 py-20 text-center">
      <div className="max-w-md space-y-4 px-6">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-bad/10 text-2xl text-bad">
          {isNotFound ? '🏥' : '⚠️'}
        </div>
        <h2 className="font-serif text-xl font-bold text-on-surface">
          {isNotFound ? 'Facility not found' : 'Could not load facility'}
        </h2>
        <p className="text-sm text-on-surface-variant">{error.message}</p>
        {error.retryable && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-container"
          >
            ↻ Retry
          </button>
        )}
      </div>
    </div>
  );
}
