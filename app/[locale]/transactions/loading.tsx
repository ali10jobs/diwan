export default function TransactionsLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-10" aria-busy="true">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-[color:var(--color-bg)]" />
        <div className="h-4 w-32 animate-pulse rounded bg-[color:var(--color-bg)]" />
      </div>
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]">
        <div className="h-10 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]" />
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-11 border-b border-[color:var(--color-border)] last:border-b-0">
            <div className="h-full animate-pulse bg-[color:var(--color-bg)]/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
