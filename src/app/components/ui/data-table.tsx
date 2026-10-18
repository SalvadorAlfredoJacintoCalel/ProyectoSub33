import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

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
  headerClassName?: string;
}

export interface DataTableServerPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages?: number;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string | number;
  loading?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  serverPagination?: DataTableServerPagination;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  maxHeight?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: React.ReactNode;
  toolbar?: React.ReactNode;
  className?: string;
  zebra?: boolean;
  dense?: boolean;
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
  data = [],
  getRowKey,
  loading = false,
  pageSize = 10,
  pageSizeOptions,
  serverPagination,
  onPageChange,
  onPageSizeChange,
  maxHeight = 560,
  emptyTitle = "No hay registros",
  emptyDescription,
  emptyIcon,
  emptyAction,
  toolbar,
  className,
  zebra = false,
  dense = false,
  onRowClick,
  selectable = false,
  selectedKeys,
  onSelectionChange,
}: DataTableProps<T>) {
  const isServer = Boolean(serverPagination);
  const [sort, setSort] = React.useState<SortState>(null);
  const [clientPage, setClientPage] = React.useState(1);
  const [clientPageSize, setClientPageSize] = React.useState(pageSize);

  React.useEffect(() => {
    setClientPageSize(pageSize);
  }, [pageSize]);

  // Client mode: reset to first page whenever the dataset changes
  React.useEffect(() => {
    if (!isServer) setClientPage(1);
  }, [data, isServer]);

  const sortedData = React.useMemo(() => {
    if (isServer || !sort) return data;
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
  }, [data, sort, columns, isServer]);

  const effectivePageSize = isServer ? serverPagination!.pageSize : clientPageSize;
  const clientTotalPages = Math.max(1, Math.ceil(sortedData.length / clientPageSize));
  const safeClientPage = Math.min(clientPage, clientTotalPages);
  const clientRows = sortedData.slice((safeClientPage - 1) * clientPageSize, safeClientPage * clientPageSize);

  const rows = isServer ? data : clientRows;
  const currentPage = isServer ? serverPagination!.page : safeClientPage;
  const totalPages = isServer
    ? serverPagination!.totalPages ?? Math.max(1, Math.ceil(serverPagination!.totalItems / serverPagination!.pageSize))
    : clientTotalPages;
  const totalItems = isServer ? serverPagination!.totalItems : sortedData.length;

  const goToPage = (p: number) => {
    const next = Math.max(1, Math.min(totalPages, p));
    if (isServer) onPageChange?.(next);
    else setClientPage(next);
  };

  const changePageSize = (size: number) => {
    if (isServer) {
      onPageSizeChange?.(size);
    } else {
      setClientPageSize(size);
      setClientPage(1);
    }
  };

  const toggleSort = (key: string) => {
    if (isServer) return;
    setSort((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
    setClientPage(1);
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
    const allKeys = rows.map(getRowKey);
    const allSelected = allKeys.length > 0 && allKeys.every((k) => selectedKeys?.has(k));
    const next = new Set(selectedKeys ?? []);
    if (allSelected) allKeys.forEach((k) => next.delete(k));
    else allKeys.forEach((k) => next.add(k));
    onSelectionChange(next);
  };

  const cellPad = dense ? "px-4 py-2" : "px-4 py-3";
  const headClassName = cn(
    "sticky top-0 z-10 bg-[var(--bg-input)] text-[var(--text-3)] font-semibold text-[11px] uppercase tracking-wide",
    cellPad,
  );
  const start = totalItems === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1;
  const end = Math.min(currentPage * effectivePageSize, totalItems);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {toolbar && <div className="flex flex-wrap items-center gap-3">{toolbar}</div>}

      <div
        className="overflow-auto rounded-2xl border bg-[var(--bg-card)] shadow-[var(--shadow)]"
        style={{ borderColor: "var(--border)", maxHeight }}
      >
        <Table>
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[var(--divider)]">
            <TableRow className="hover:bg-transparent">
              {selectable && (
                <TableHead className={cn("w-10", headClassName)}>
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && rows.every((r) => selectedKeys?.has(getRowKey(r)))}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer accent-[var(--brand-600)]"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead key={col.key} className={cn(headClassName, col.headerClassName)}>
                  {col.sortable && !isServer ? (
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-[var(--brand-600)]"
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
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="hover:bg-transparent">
                  {selectable && (
                    <TableCell className={cellPad}>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key} className={cellPad}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="p-0">
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => {
                const key = getRowKey(row);
                const isSelected = selectedKeys?.has(key);
                return (
                  <TableRow
                    key={key}
                    className={cn(
                      "animate-slide-up-stagger border-b border-[var(--divider)] transition-colors last:border-0 hover:bg-[var(--bg-hover)]",
                      onRowClick && "cursor-pointer",
                      zebra && index % 2 === 1 && "bg-[var(--bg-hover)]/40",
                      isSelected && "bg-[var(--brand-50)] shadow-[inset_3px_0_0_0_var(--brand-500)]",
                    )}
                    style={{ animationDelay: `${Math.min(index, 5) * 40}ms` }}
                    data-state={isSelected ? "selected" : undefined}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <TableCell className={cellPad} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected ?? false}
                          onChange={() => toggleRow(key)}
                          className="h-4 w-4 cursor-pointer accent-[var(--brand-600)]"
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key} className={cn(cellPad, col.className)}>
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

      {!loading && totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-sm" style={{ color: "var(--text-2)" }}>
          <div className="flex items-center gap-3">
            <span className="text-xs">
              Mostrando {start}–{end} de {totalItems} registro{totalItems !== 1 ? "s" : ""}
            </span>
            {pageSizeOptions && pageSizeOptions.length > 0 && (
              <select
                value={effectivePageSize}
                onChange={(e) => changePageSize(Number(e.target.value))}
                className="rounded-lg px-2 py-1 text-xs outline-none"
                style={{ background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)" }}
              >
                {pageSizeOptions.map((s) => (
                  <option key={s} value={s}>
                    {s} / página
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-2)] transition-colors duration-150 hover:border-[var(--brand-500)] hover:text-[var(--brand-600)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
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
