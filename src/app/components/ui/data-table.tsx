import * as React from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "./utils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./table";
import { Skeleton } from "./skeleton";
import { EmptyState } from "./empty-state";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string | number;
  loading?: boolean;
  pageSize?: number;
  maxHeight?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedKeys?: Set<string | number>;
  onSelectionChange?: (keys: Set<string | number>) => void;
}

type SortState = { key: string; direction: "asc" | "desc" } | null;

function accessValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  loading = false,
  pageSize = 10,
  maxHeight = 560,
  emptyTitle = "No hay registros",
  emptyDescription,
  onRowClick,
  selectable = false,
  selectedKeys,
  onSelectionChange,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<SortState>(null);
  const [page, setPage] = React.useState(1);

  const sortedData = React.useMemo(() => {
    if (!sort) return data;
    const column = columns.find((c) => c.key === sort.key);
    if (!column) return data;

    const getVal = (row: T): string | number => {
      if (column.sortValue) return column.sortValue(row);
      const raw = accessValue(row, sort.key);
      if (typeof raw === "number") return raw;
      return String(raw ?? "");
    };

    return [...data].sort((a, b) => {
      const aVal = getVal(a);
      const bVal = getVal(b);
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sort.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sort.direction === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [data, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sortedData.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
    setPage(1);
  };

  const toggleRow = (key: string | number) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedKeys ?? []);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange(next);
  };

  const toggleAll = () => {
    if (!onSelectionChange) return;
    const allKeys = pageRows.map(getRowKey);
    const allSelected = allKeys.every((k) => selectedKeys?.has(k));
    const next = new Set(selectedKeys ?? []);
    if (allSelected) allKeys.forEach((k) => next.delete(k));
    else allKeys.forEach((k) => next.add(k));
    onSelectionChange(next);
  };

  const headClassName = "sticky top-0 z-10 bg-[var(--glass-bg-strong)] backdrop-blur";

  return (
    <div className="flex flex-col gap-3">
      <div
        className="overflow-auto rounded-xl border"
        style={{ borderColor: "var(--border)", maxHeight }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className={cn("w-10", headClassName)}>
                  <input
                    type="checkbox"
                    checked={pageRows.length > 0 && pageRows.every((r) => selectedKeys?.has(getRowKey(r)))}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer accent-[var(--brand-600)]"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead key={col.key} className={cn(headClassName, col.className)}>
                  {col.sortable ? (
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors hover:text-[var(--brand-600)]"
                      style={{ color: sort?.key === col.key ? "var(--brand-600)" : "var(--text-3)" }}
                    >
                      {col.header}
                      {sort?.key === col.key ? (
                        sort.direction === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5 animate-scale-in" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 animate-scale-in" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                      )}
                    </button>
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                      {col.header}
                    </span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {selectable && (
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row, index) => {
                const key = getRowKey(row);
                const isSelected = selectedKeys?.has(key);
                return (
                  <TableRow
                    key={key}
                    className={cn(
                      "animate-slide-up-stagger transition-colors",
                      onRowClick && "cursor-pointer",
                      isSelected &&
                        "bg-[var(--brand-50)] shadow-[inset_3px_0_0_0_var(--brand-500)]",
                    )}
                    style={{ animationDelay: `${Math.min(index, 5) * 40}ms` }}
                    data-state={isSelected ? "selected" : undefined}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected ?? false}
                          onChange={() => toggleRow(key)}
                          className="h-4 w-4 cursor-pointer accent-[var(--brand-600)]"
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key} className={cn(col.className)}>
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && sortedData.length > 0 && (
        <div className="flex items-center justify-between px-2 text-sm" style={{ color: "var(--text-2)" }}>
          <span className="text-xs">
            {sortedData.length} registro{sortedData.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-2)] transition-colors duration-150 hover:border-[var(--brand-500)] hover:text-[var(--brand-600)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-medium">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-2)] transition-colors duration-150 hover:border-[var(--brand-500)] hover:text-[var(--brand-600)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
