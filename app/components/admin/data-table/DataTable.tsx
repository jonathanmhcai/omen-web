"use client";

import { Fragment, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { Inbox } from "lucide-react";

interface DataTableProps<T> {
  data: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  loading: boolean;
  error: string | null;
  defaultSorting?: SortingState;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  manualSorting?: boolean;
  skeletonWidths?: Record<string, string>;
  toolbar?: React.ReactNode;
  // Expandable rows: pass all four together. Clicking a row (away from
  // anchors / buttons) calls onRowClick; when a row's id matches
  // expandedRowId, renderExpandedRow's output is shown in an embedded
  // row directly beneath it.
  getRowId?: (row: T) => string;
  expandedRowId?: string | null;
  onRowClick?: (row: T) => void;
  renderExpandedRow?: (row: T) => React.ReactNode;
}

const SKELETON_ROWS = 15;

function SkeletonRow({ widths }: { widths: Record<string, string> }) {
  return (
    <tr className="border-b border-black/[.04] last:border-0 dark:border-white/[.06]">
      {Object.entries(widths).map(([key, size]) => (
        <td key={key} className="px-4 py-2">
          <div className={`${size} animate-pulse rounded bg-zinc-200 dark:bg-zinc-800`} />
        </td>
      ))}
    </tr>
  );
}

export default function DataTable<T>({
  data,
  columns,
  loading,
  error,
  defaultSorting = [],
  sorting: controlledSorting,
  onSortingChange: controlledOnSortingChange,
  manualSorting = false,
  skeletonWidths,
  toolbar,
  getRowId,
  expandedRowId,
  onRowClick,
  renderExpandedRow,
}: DataTableProps<T>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>(defaultSorting);
  const sorting = controlledSorting ?? internalSorting;
  const setSorting = controlledOnSortingChange ?? setInternalSorting;

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
    },
    manualSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
  });

  const defaultWidths: Record<string, string> = {};
  if (!skeletonWidths) {
    for (const col of columns) {
      const id = (col as { id?: string; accessorKey?: string }).id ?? (col as { accessorKey?: string }).accessorKey ?? "";
      defaultWidths[id] = "h-4 w-20";
    }
  }
  const widths = skeletonWidths ?? defaultWidths;

  return (
    <div className="flex flex-col gap-3">
      {toolbar}
      {error ? (
        <p className="text-sm text-red-500">Error: {error}</p>
      ) : (
      <div className="w-full overflow-x-auto rounded-xl border border-black/[.08] dark:border-white/[.145]">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            {columns.map((col, i) => (
              <col key={i} style={{ width: (col as { size?: number }).size }} />
            ))}
          </colgroup>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-black/[.08] dark:border-white/[.145]">
                {headerGroup.headers.map((header) => {
                  const isSortable = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const sortIndex = header.column.getSortIndex();
                  const isMultiSort = sorting.length > 1;
                  return (
                    <th
                      key={header.id}
                      className={`whitespace-nowrap px-4 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400${isSortable ? " cursor-pointer select-none hover:text-zinc-800 dark:hover:text-zinc-200" : ""}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {sorted && (
                        <span className="ml-1">
                          {sorted === "asc" ? "\u2191" : "\u2193"}
                          {isMultiSort && sortIndex >= 0 && (
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{sortIndex + 1}</span>
                          )}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: SKELETON_ROWS }, (_, i) => <SkeletonRow key={i} widths={widths} />)
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12">
                  <div className="flex flex-col items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <Inbox className="h-8 w-8" strokeWidth={1.5} />
                    <span className="text-sm">No data found</span>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const rowId = getRowId?.(row.original);
                const isExpanded =
                  rowId != null && expandedRowId === rowId;
                const clickable = onRowClick != null;
                return (
                  <Fragment key={row.id}>
                    <tr
                      className={`border-b border-black/[.04] last:border-0 dark:border-white/[.06]${clickable ? " cursor-pointer hover:bg-black/[.02] dark:hover:bg-white/[.03]" : ""}${isExpanded ? " bg-black/[.02] dark:bg-white/[.03]" : ""}`}
                      onClick={
                        clickable
                          ? (e) => {
                              // Skip toggle when the click landed on an
                              // interactive child (links, buttons,
                              // checkboxes) so the headline link still
                              // navigates and the seed-author / external
                              // links still open.
                              if (
                                (e.target as HTMLElement).closest(
                                  "a, button, input, label",
                                )
                              ) {
                                return;
                              }
                              onRowClick(row.original);
                            }
                          : undefined
                      }
                    >
                      {row.getVisibleCells().map((cell) => {
                        const isTitle = cell.column.id === "title";
                        let className = "px-4 py-2";
                        if (isTitle) {
                          className = "truncate px-4 py-2 font-medium";
                        } else if (cell.column.id !== "image") {
                          className = "whitespace-nowrap px-4 py-2";
                        }
                        return (
                          <td key={cell.id} className={className}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                    {isExpanded && renderExpandedRow && (
                      <tr className="border-b border-black/[.08] bg-black/[.015] dark:border-white/[.10] dark:bg-white/[.02]">
                        <td colSpan={row.getVisibleCells().length} className="px-4 py-4">
                          {renderExpandedRow(row.original)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
