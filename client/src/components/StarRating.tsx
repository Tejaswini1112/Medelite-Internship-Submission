interface StarRatingProps {
  value: number | null;
  label: string;
}

export function StarRating({ value, label }: StarRatingProps) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-bright p-2 text-center">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-label text-outline">{label}</p>
      <div className="flex justify-center text-base leading-none text-primary" aria-label={value === null ? 'Not available' : `${value} of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={value !== null && i <= value ? 'text-primary' : 'text-outline-variant'}>
            {value !== null && i <= value ? '★' : '☆'}
          </span>
        ))}
      </div>
      <p className="mt-1 text-xs font-semibold text-on-surface">
        {value === null ? 'N/A' : `${value} Star${value === 1 ? '' : 's'}`}
      </p>
    </div>
  );
}
