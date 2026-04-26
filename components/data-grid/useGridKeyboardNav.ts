"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Virtualizer } from "@tanstack/react-virtual";

type Cursor = { r: number; c: number };

/**
 * W3C ARIA grid keyboard pattern for the virtualized transactions
 * table. Roving tabindex: only the active cell is in the tab order;
 * arrow keys move the cursor; Home/End jump to row edges; Ctrl+Home /
 * Ctrl+End jump to grid corners; PageUp/PageDown move by one viewport
 * minus one row of overlap.
 *
 * RTL: ArrowLeft/ArrowRight are *visual*. In RTL, ArrowRight should
 * move to the previous column and ArrowLeft to the next, so the user's
 * mental model matches the rendered direction.
 *
 * Virtualization integration: when the cursor lands on a row outside
 * the rendered window, we ask the virtualizer to bring it in, then
 * focus it on the next animation frame once the DOM has caught up.
 *
 * Typeahead: printable characters jump to the first row whose first-
 * column text starts with the buffer (debounced 500ms). Useful for
 * large tables; harmless on small ones.
 */
export function useGridKeyboardNav({
  rowCount,
  colCount,
  rowVirtualizer,
  scrollRef,
  isRtl,
  getRowKey,
}: {
  rowCount: number;
  colCount: number;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  scrollRef: RefObject<HTMLDivElement | null>;
  isRtl: boolean;
  /** First-column text used by typeahead. */
  getRowKey?: (rowIndex: number) => string;
}) {
  // `rawCursor` holds the user's intent; `cursor` is the clamped value
  // derived during render. Deriving (instead of syncing via an effect)
  // keeps the data flow one-way and avoids cascading renders.
  const [rawCursor, setRawCursor] = useState<Cursor>({ r: 0, c: 0 });
  const cursor = useMemo<Cursor>(
    () => ({
      r: Math.min(Math.max(0, rawCursor.r), Math.max(0, rowCount - 1)),
      c: Math.min(Math.max(0, rawCursor.c), Math.max(0, colCount - 1)),
    }),
    [rawCursor, rowCount, colCount],
  );
  const cursorRef = useRef(cursor);
  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);
  const typeaheadRef = useRef<{ buf: string; timer: number | null }>({ buf: "", timer: null });

  // Move DOM focus to the active cell whenever the cursor changes.
  useEffect(() => {
    if (rowCount === 0) return;
    rowVirtualizer.scrollToIndex(cursor.r, { align: "auto" });
    const id = requestAnimationFrame(() => {
      const cell = scrollRef.current?.querySelector<HTMLElement>(
        `[data-r="${cursor.r}"][data-c="${cursor.c}"]`,
      );
      if (cell && document.activeElement !== cell) cell.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [cursor, rowVirtualizer, rowCount, scrollRef]);

  const visibleRowCount = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return 10;
    // First virtual item gives a reliable row size; fall back to 44px.
    const items = rowVirtualizer.getVirtualItems();
    const size = items[0]?.size ?? 44;
    return Math.max(1, Math.floor(el.clientHeight / size) - 1);
  }, [rowVirtualizer, scrollRef]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (rowCount === 0) return;
      // If focus is inside an open popover or input, let the embedded
      // control handle the key — grid nav only applies when the active
      // element is a cell in this grid.
      const target = e.target as HTMLElement;
      if (!target.matches("[data-r][data-c]")) return;

      const cur = cursorRef.current;
      let next: Cursor | null = null;

      switch (e.key) {
        case "ArrowDown":
          next = { r: Math.min(rowCount - 1, cur.r + 1), c: cur.c };
          break;
        case "ArrowUp":
          next = { r: Math.max(0, cur.r - 1), c: cur.c };
          break;
        case "ArrowRight":
          next = { r: cur.r, c: clamp(cur.c + (isRtl ? -1 : 1), 0, colCount - 1) };
          break;
        case "ArrowLeft":
          next = { r: cur.r, c: clamp(cur.c + (isRtl ? 1 : -1), 0, colCount - 1) };
          break;
        case "Home":
          next = e.ctrlKey ? { r: 0, c: 0 } : { r: cur.r, c: 0 };
          break;
        case "End":
          next = e.ctrlKey ? { r: rowCount - 1, c: colCount - 1 } : { r: cur.r, c: colCount - 1 };
          break;
        case "PageDown": {
          const step = visibleRowCount();
          next = { r: Math.min(rowCount - 1, cur.r + step), c: cur.c };
          break;
        }
        case "PageUp": {
          const step = visibleRowCount();
          next = { r: Math.max(0, cur.r - step), c: cur.c };
          break;
        }
        default: {
          // Typeahead: single printable char, no modifiers.
          if (getRowKey && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const ta = typeaheadRef.current;
            ta.buf = (ta.buf + e.key).toLowerCase();
            if (ta.timer != null) window.clearTimeout(ta.timer);
            ta.timer = window.setTimeout(() => (ta.buf = ""), 500);

            for (let r = 0; r < rowCount; r++) {
              const key = getRowKey(r).toLowerCase();
              if (key.startsWith(ta.buf)) {
                e.preventDefault();
                setRawCursor({ r, c: 0 });
                return;
              }
            }
          }
          return;
        }
      }

      if (next) {
        e.preventDefault();
        setRawCursor(next);
      }
    },
    [rowCount, colCount, isRtl, visibleRowCount, getRowKey],
  );

  /** Used by the optional skip-link to jump into the grid. */
  const focusFirstCell = useCallback(() => {
    setRawCursor({ r: 0, c: 0 });
  }, []);

  return { cursor, onKeyDown, focusFirstCell };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}
