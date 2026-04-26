"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Transaction } from "@/lib/types/transaction";
import { formatSar } from "@/lib/formatters/currency";
import {
  TRANSACTION_CHANNELS,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  GOVERNORATES,
} from "@/lib/types/transaction";
import { useTransactionsUrlState } from "./useTransactionsUrlState";
import { useTransactionsTableQuery } from "./useTransactionsTableQuery";
import { MultiSelectFilter } from "./filters/MultiSelectFilter";
import { NumberRangeFilter } from "./filters/NumberRangeFilter";
import { DateRangeFilter } from "./filters/DateRangeFilter";
import type { TransactionsQuery } from "@/lib/url/transactions-query";

type SortField = "createdAt" | "amountSar";

type FilterKind =
  | { kind: "multi-status" }
  | { kind: "multi-type" }
  | { kind: "multi-channel" }
  | { kind: "multi-governorate" }
  | { kind: "amount" }
  | { kind: "date" };

type ColumnMeta = { align?: "end"; filter?: FilterKind; label?: string };

/**
 * Phase 5 slice A — server-driven Transactions table.
 *
 * - URL is the source of truth for `page`, `pageSize`, and `sort`.
 * - TanStack Table runs in **manual mode** (`manualSorting`,
 *   `manualPagination`): the server already paginates and sorts via the
 *   route handler, and the client must not re-sort the visible page.
 * - Only `createdAt` and `amountSar` are sortable in this slice — they
 *   match the schema's `SortableField` union; other columns are
 *   filterable but not sortable until slice C lands the filter UI.
 * - No virtualization yet — that arrives in slice B.
 */
export function TransactionsTable() {
  const t = useTranslations("transactions");
  const tStatus = useTranslations("transactions.status");
  const tType = useTranslations("transactions.type");
  const tChannel = useTranslations("transactions.channel");
  const tGov = useTranslations("transactions.governorate");
  const locale = useLocale() as Locale;
  const fmt = useFormatter();

  const { query, setQuery } = useTransactionsUrlState();
  const { data, isFetching, isError, error, refetch } = useTransactionsTableQuery(query);

  const sorting: SortingState = useMemo(
    () => [{ id: query.sort.field, desc: query.sort.direction === "desc" }],
    [query.sort],
  );

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        id: "id",
        accessorKey: "id",
        header: () => t("columns.id"),
        cell: (ctx) => (
          <span className="font-mono text-xs text-[color:var(--color-fg-muted)]">
            {ctx.getValue<string>()}
          </span>
        ),
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: () => t("columns.createdAt"),
        cell: (ctx) =>
          fmt.dateTime(new Date(ctx.getValue<string>()), {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        enableSorting: true,
        meta: { filter: { kind: "date" }, label: t("columns.createdAt") } satisfies ColumnMeta,
      },
      {
        id: "type",
        accessorKey: "type",
        header: () => t("columns.type"),
        cell: (ctx) => tType(ctx.getValue<Transaction["type"]>()),
        meta: { filter: { kind: "multi-type" }, label: t("columns.type") } satisfies ColumnMeta,
      },
      {
        id: "channel",
        accessorKey: "channel",
        header: () => t("columns.channel"),
        cell: (ctx) => tChannel(ctx.getValue<Transaction["channel"]>()),
        meta: {
          filter: { kind: "multi-channel" },
          label: t("columns.channel"),
        } satisfies ColumnMeta,
      },
      {
        id: "status",
        accessorKey: "status",
        header: () => t("columns.status"),
        cell: (ctx) => <StatusPill value={ctx.getValue<Transaction["status"]>()} t={tStatus} />,
        meta: {
          filter: { kind: "multi-status" },
          label: t("columns.status"),
        } satisfies ColumnMeta,
      },
      {
        id: "governorate",
        accessorKey: "governorate",
        header: () => t("columns.governorate"),
        cell: (ctx) => tGov(ctx.getValue<Transaction["governorate"]>()),
        meta: {
          filter: { kind: "multi-governorate" },
          label: t("columns.governorate"),
        } satisfies ColumnMeta,
      },
      {
        id: "amountSar",
        accessorKey: "amountSar",
        header: () => t("columns.amount"),
        cell: (ctx) => (
          <span className="tabular-nums">{formatSar(ctx.getValue<number>(), locale)}</span>
        ),
        enableSorting: true,
        meta: {
          align: "end",
          filter: { kind: "amount" },
          label: t("columns.amount"),
        } satisfies ColumnMeta,
      },
    ],
    [t, tStatus, tType, tChannel, tGov, fmt, locale],
  );

  const table = useReactTable<Transaction>({
    data: data?.items ?? [],
    columns,
    state: { sorting },
    manualSorting: true,
    manualPagination: true,
    pageCount: data?.totalPages ?? -1,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];
      if (!first) {
        setQuery((prev) => ({
          ...prev,
          sort: { field: "createdAt", direction: "desc" },
          page: 1,
        }));
        return;
      }
      // Guard the sort field against the schema's allowed set so a
      // future `enableSorting: true` on a non-sortable column can't
      // produce an invalid URL.
      if (first.id !== "createdAt" && first.id !== "amountSar") return;
      setQuery((prev) => ({
        ...prev,
        sort: { field: first.id as SortField, direction: first.desc ? "desc" : "asc" },
        page: 1,
      }));
    },
  });

  const total = data?.total ?? 0;
  const page = query.page;
  const totalPages = data?.totalPages ?? 1;

  // Virtualization: the page itself is server-paginated (≤ pageSize rows),
  // but with `pageSize=100` of multi-cell rows the DOM cost is still
  // material. Virtualizing inside the page gives constant scroll cost
  // regardless of pageSize, and keeps the door open to bumping the page
  // size later without re-architecting.
  const rows = table.getRowModel().rows;
  const scrollRef = useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = 44; // matches "comfortable" density; revisit when wiring density
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });
  // Reset scroll to the top whenever the page or sort changes — otherwise
  // landing on page 2 mid-scroll feels like the data jumped under the user.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [page, query.sort.field, query.sort.direction]);

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]!.start : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1]!.end : 0;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
            {t("rowsFound", { count: total })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {countActiveFilters(query) > 0 ? (
            <button
              type="button"
              onClick={() => setQuery((prev) => clearFilters(prev))}
              className="text-xs font-medium text-[color:var(--color-fg-muted)] underline-offset-2 hover:text-[color:var(--color-fg)] hover:underline"
            >
              {t("filters.clearAll", { count: countActiveFilters(query) })}
            </button>
          ) : null}
          <div className="text-xs text-[color:var(--color-fg-muted)]" aria-live="polite">
            {isFetching ? t("refreshing") : null}
          </div>
        </div>
      </header>

      <MobileFilterBar
        query={query}
        setQuery={setQuery}
        labels={{
          status: tStatus,
          type: tType,
          channel: tChannel,
          gov: tGov,
          column: {
            createdAt: t("columns.createdAt"),
            type: t("columns.type"),
            channel: t("columns.channel"),
            status: t("columns.status"),
            governorate: t("columns.governorate"),
            amount: t("columns.amount"),
          },
        }}
      />

      {isError ? (
        <ErrorState message={(error as Error)?.message ?? "Unknown error"} onRetry={refetch} />
      ) : (
        <div
          ref={scrollRef}
          // Bounded scroll container is what makes virtualization possible —
          // the page itself never grows, only the inner scrollport does.
          className="relative max-h-[calc(100vh-16rem)] min-h-[24rem] overflow-auto rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]"
        >
          <table
            role="grid"
            aria-rowcount={total}
            aria-busy={isFetching}
            className="w-full border-collapse text-sm"
          >
            <thead className="sticky top-0 z-10 bg-[color:var(--color-bg)] text-[color:var(--color-fg-muted)] shadow-[0_1px_0_0_var(--color-border)]">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => {
                    const sortDir = header.column.getIsSorted();
                    const canSort = header.column.getCanSort();
                    const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                    const align = meta?.align === "end" ? "text-end" : "text-start";
                    const justify = meta?.align === "end" ? "justify-end" : "justify-start";
                    const ariaSort: "ascending" | "descending" | "none" | undefined = canSort
                      ? sortDir === "asc"
                        ? "ascending"
                        : sortDir === "desc"
                          ? "descending"
                          : "none"
                      : undefined;
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        aria-sort={ariaSort}
                        className={`h-10 px-3 text-xs font-semibold uppercase tracking-wide ${align}`}
                      >
                        <div className={`flex items-center gap-1 ${justify}`}>
                          {canSort ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-1.5 rounded outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <SortIcon dir={sortDir} />
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                          {meta?.filter ? (
                            <HeaderFilter
                              kind={meta.filter.kind}
                              label={meta.label ?? ""}
                              query={query}
                              setQuery={setQuery}
                              labels={{
                                status: tStatus,
                                type: tType,
                                channel: tChannel,
                                gov: tGov,
                              }}
                            />
                          ) : null}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {paddingTop > 0 ? (
                <tr aria-hidden style={{ height: paddingTop }}>
                  <td colSpan={columns.length} />
                </tr>
              ) : null}
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index] as Row<Transaction>;
                return (
                  <tr
                    key={row.id}
                    aria-rowindex={(page - 1) * query.pageSize + virtualRow.index + 2}
                    style={{ height: ROW_HEIGHT }}
                    className="border-t border-[color:var(--color-border)] hover:bg-[color:var(--color-bg)]/60"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const align =
                        (cell.column.columnDef.meta as ColumnMeta | undefined)?.align === "end"
                          ? "text-end"
                          : "text-start";
                      return (
                        <td key={cell.id} className={`px-3 py-2 align-middle ${align}`}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {paddingBottom > 0 ? (
                <tr aria-hidden style={{ height: paddingBottom }}>
                  <td colSpan={columns.length} />
                </tr>
              ) : null}
              {data && data.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-3 py-12 text-center text-sm text-[color:var(--color-fg-muted)]"
                  >
                    {t("empty")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPage={(nextPage) => setQuery((prev) => ({ ...prev, page: nextPage }))}
        labels={{
          prev: t("pagination.prev"),
          next: t("pagination.next"),
          status: t("pagination.status", { page, totalPages }),
        }}
      />
    </div>
  );
}

function SortIcon({ dir }: { dir: false | "asc" | "desc" }) {
  if (dir === "asc") return <ArrowUp className="size-3.5" aria-hidden />;
  if (dir === "desc") return <ArrowDown className="size-3.5" aria-hidden />;
  return <ArrowUpDown className="size-3.5 opacity-50" aria-hidden />;
}

function StatusPill({ value, t }: { value: Transaction["status"]; t: (key: string) => string }) {
  const tone: Record<Transaction["status"], string> = {
    succeeded: "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]",
    failed: "bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)]",
    pending: "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]",
    reversed: "bg-[color:var(--color-fg-muted)]/15 text-[color:var(--color-fg-muted)]",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tone[value]}`}>
      {t(value)}
    </span>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
  labels,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  labels: { prev: string; next: string; status: string };
}) {
  const canPrev = page > 1;
  const canNext = page < totalPages;
  return (
    <nav aria-label={labels.status} className="flex items-center justify-between gap-3 text-sm">
      <span className="text-[color:var(--color-fg-muted)]">{labels.status}</span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPage(page - 1)}
          className="rounded-md border border-[color:var(--color-border)] px-3 py-1.5 text-sm disabled:opacity-40"
        >
          {labels.prev}
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPage(page + 1)}
          className="rounded-md border border-[color:var(--color-border)] px-3 py-1.5 text-sm disabled:opacity-40"
        >
          {labels.next}
        </button>
      </div>
    </nav>
  );
}

type FilterLabels = {
  status: (key: Transaction["status"]) => string;
  type: (key: Transaction["type"]) => string;
  channel: (key: Transaction["channel"]) => string;
  gov: (key: string) => string;
};

function HeaderFilter({
  kind,
  label,
  query,
  setQuery,
  labels,
}: {
  kind: FilterKind["kind"];
  label: string;
  query: TransactionsQuery;
  setQuery: (next: (prev: TransactionsQuery) => TransactionsQuery) => void;
  labels: FilterLabels;
}) {
  switch (kind) {
    case "multi-status":
      return (
        <MultiSelectFilter
          label={label}
          options={TRANSACTION_STATUSES}
          value={query.status}
          optionLabel={(k) => labels.status(k)}
          onChange={(next) => setQuery((prev) => ({ ...prev, status: next, page: 1 }))}
        />
      );
    case "multi-type":
      return (
        <MultiSelectFilter
          label={label}
          options={TRANSACTION_TYPES}
          value={query.type}
          optionLabel={(k) => labels.type(k)}
          onChange={(next) => setQuery((prev) => ({ ...prev, type: next, page: 1 }))}
        />
      );
    case "multi-channel":
      return (
        <MultiSelectFilter
          label={label}
          options={TRANSACTION_CHANNELS}
          value={query.channel}
          optionLabel={(k) => labels.channel(k)}
          onChange={(next) => setQuery((prev) => ({ ...prev, channel: next, page: 1 }))}
        />
      );
    case "multi-governorate":
      return (
        <MultiSelectFilter
          label={label}
          options={GOVERNORATES}
          value={query.governorate as readonly (typeof GOVERNORATES)[number][] | undefined}
          optionLabel={(k) => labels.gov(k)}
          onChange={(next) => setQuery((prev) => ({ ...prev, governorate: next, page: 1 }))}
        />
      );
    case "amount":
      return (
        <NumberRangeFilter
          label={label}
          minSar={query.minAmount}
          maxSar={query.maxAmount}
          onChange={({ min, max }) =>
            setQuery((prev) => ({ ...prev, minAmount: min, maxAmount: max, page: 1 }))
          }
        />
      );
    case "date":
      return (
        <DateRangeFilter
          label={label}
          dateFrom={query.dateFrom}
          dateTo={query.dateTo}
          onChange={({ from, to }) =>
            setQuery((prev) => ({ ...prev, dateFrom: from, dateTo: to, page: 1 }))
          }
        />
      );
  }
}

function MobileFilterBar({
  query,
  setQuery,
  labels,
}: {
  query: TransactionsQuery;
  setQuery: (next: (prev: TransactionsQuery) => TransactionsQuery) => void;
  labels: FilterLabels & {
    column: {
      createdAt: string;
      type: string;
      channel: string;
      status: string;
      governorate: string;
      amount: string;
    };
  };
}) {
  // Visible only at < md. Each entry triggers the same popover-based
  // filter component used in the header — Radix portals the popover
  // above the table flow so it isn't clipped.
  return (
    <div className="flex flex-wrap items-center gap-2 md:hidden">
      <MobileFilterChip label={labels.column.status}>
        <HeaderFilter
          kind="multi-status"
          label={labels.column.status}
          query={query}
          setQuery={setQuery}
          labels={labels}
        />
      </MobileFilterChip>
      <MobileFilterChip label={labels.column.type}>
        <HeaderFilter
          kind="multi-type"
          label={labels.column.type}
          query={query}
          setQuery={setQuery}
          labels={labels}
        />
      </MobileFilterChip>
      <MobileFilterChip label={labels.column.channel}>
        <HeaderFilter
          kind="multi-channel"
          label={labels.column.channel}
          query={query}
          setQuery={setQuery}
          labels={labels}
        />
      </MobileFilterChip>
      <MobileFilterChip label={labels.column.governorate}>
        <HeaderFilter
          kind="multi-governorate"
          label={labels.column.governorate}
          query={query}
          setQuery={setQuery}
          labels={labels}
        />
      </MobileFilterChip>
      <MobileFilterChip label={labels.column.createdAt}>
        <HeaderFilter
          kind="date"
          label={labels.column.createdAt}
          query={query}
          setQuery={setQuery}
          labels={labels}
        />
      </MobileFilterChip>
      <MobileFilterChip label={labels.column.amount}>
        <HeaderFilter
          kind="amount"
          label={labels.column.amount}
          query={query}
          setQuery={setQuery}
          labels={labels}
        />
      </MobileFilterChip>
    </div>
  );
}

function MobileFilterChip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] py-0.5 pe-1 ps-3 text-xs">
      {label}
      {children}
    </span>
  );
}

function countActiveFilters(q: TransactionsQuery): number {
  let n = 0;
  if (q.status?.length) n++;
  if (q.type?.length) n++;
  if (q.channel?.length) n++;
  if (q.governorate?.length) n++;
  if (q.minAmount !== undefined || q.maxAmount !== undefined) n++;
  if (q.dateFrom || q.dateTo) n++;
  return n;
}

function clearFilters(q: TransactionsQuery): TransactionsQuery {
  // Strip every filter field but keep paging/sort metadata so the user
  // doesn't lose their sort choice when wiping filters.
  const { status, type, channel, governorate, minAmount, maxAmount, dateFrom, dateTo, ...rest } = q;
  void status;
  void type;
  void channel;
  void governorate;
  void minAmount;
  void maxAmount;
  void dateFrom;
  void dateTo;
  return { ...rest, page: 1 };
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/5 p-4 text-sm"
    >
      <p className="font-medium text-[color:var(--color-danger)]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 rounded border border-[color:var(--color-border)] px-3 py-1 text-xs"
      >
        Retry
      </button>
    </div>
  );
}
