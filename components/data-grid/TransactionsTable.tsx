"use client";

import { useMemo } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Transaction } from "@/lib/types/transaction";
import { formatSar } from "@/lib/formatters/currency";
import { useTransactionsUrlState } from "./useTransactionsUrlState";
import { useTransactionsTableQuery } from "./useTransactionsTableQuery";

type SortField = "createdAt" | "amountSar";

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
      },
      {
        id: "type",
        accessorKey: "type",
        header: () => t("columns.type"),
        cell: (ctx) => tType(ctx.getValue<Transaction["type"]>()),
      },
      {
        id: "channel",
        accessorKey: "channel",
        header: () => t("columns.channel"),
        cell: (ctx) => tChannel(ctx.getValue<Transaction["channel"]>()),
      },
      {
        id: "status",
        accessorKey: "status",
        header: () => t("columns.status"),
        cell: (ctx) => <StatusPill value={ctx.getValue<Transaction["status"]>()} t={tStatus} />,
      },
      {
        id: "governorate",
        accessorKey: "governorate",
        header: () => t("columns.governorate"),
        cell: (ctx) => tGov(ctx.getValue<Transaction["governorate"]>()),
      },
      {
        id: "amountSar",
        accessorKey: "amountSar",
        header: () => t("columns.amount"),
        cell: (ctx) => (
          <span className="tabular-nums">{formatSar(ctx.getValue<number>(), locale)}</span>
        ),
        enableSorting: true,
        meta: { align: "end" as const },
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

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
            {t("rowsFound", { count: total })}
          </p>
        </div>
        <div className="text-xs text-[color:var(--color-fg-muted)]" aria-live="polite">
          {isFetching ? t("refreshing") : null}
        </div>
      </header>

      {isError ? (
        <ErrorState message={(error as Error)?.message ?? "Unknown error"} onRetry={refetch} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]">
          <table
            role="grid"
            aria-rowcount={total}
            aria-busy={isFetching}
            className="w-full border-collapse text-sm"
          >
            <thead className="bg-[color:var(--color-bg)] text-[color:var(--color-fg-muted)]">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => {
                    const sortDir = header.column.getIsSorted();
                    const canSort = header.column.getCanSort();
                    const align =
                      (header.column.columnDef.meta as { align?: "end" } | undefined)?.align ===
                      "end"
                        ? "text-end"
                        : "text-start";
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
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, idx) => (
                <tr
                  key={row.id}
                  aria-rowindex={(page - 1) * query.pageSize + idx + 2}
                  className="border-t border-[color:var(--color-border)] hover:bg-[color:var(--color-bg)]/60"
                >
                  {row.getVisibleCells().map((cell) => {
                    const align =
                      (cell.column.columnDef.meta as { align?: "end" } | undefined)?.align === "end"
                        ? "text-end"
                        : "text-start";
                    return (
                      <td key={cell.id} className={`px-3 py-2 align-middle ${align}`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))}
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
