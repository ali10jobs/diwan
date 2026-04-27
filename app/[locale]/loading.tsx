export default function LocaleLoading() {
  return (
    <div role="status" aria-busy="true" className="flex min-h-[60vh] flex-col gap-4 p-6 sm:p-10">
      <div className="h-7 w-48 animate-pulse rounded bg-[color:var(--color-bg-elevated)]" />
      <div className="h-4 w-64 animate-pulse rounded bg-[color:var(--color-bg-elevated)]" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]"
          />
        ))}
      </div>
    </div>
  );
}
