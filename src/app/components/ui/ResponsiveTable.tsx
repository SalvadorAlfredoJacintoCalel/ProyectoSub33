import * as React from "react";

import { cn } from "./utils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./table";
import { EmptyState } from "./empty-state";

export interface ResponsiveColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  label?: string;
  hideOnMobile?: boolean;
  mobileLabel?: string;
}

export interface ResponsiveTableProps<T> {
  columns: ResponsiveColumn<T>[];
  data: T[];
  keyField: keyof T | ((row: T) => string | number);
  renderCard?: (row: T) => React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  desktopClassName?: string;
  mobileClassName?: string;
}

export function ResponsiveTable<T>({
  columns,
  data = [],
  keyField,
  renderCard,
  emptyTitle = "No hay registros",
  emptyDescription,
  className,
  desktopClassName,
  mobileClassName,
}: ResponsiveTableProps<T>) {
  const getKey =
    typeof keyField === "function"
      ? keyField
      : (row: T) => (row as Record<string, unknown>)[keyField as string] as string | number;

  const visibleColumns = columns.filter((c) => !c.hideOnMobile);

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("hidden md:block overflow-x-auto rounded-2xl border", desktopClassName)} style={{ borderColor: "var(--border)" }}>
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={cn("text-[11px] uppercase tracking-wide", col.headerClassName)}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={getKey(row)}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className={cn("md:hidden space-y-3", mobileClassName)}>
        {data.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          data.map((row) => {
            if (renderCard) {
              return <React.Fragment key={getKey(row)}>{renderCard(row)}</React.Fragment>;
            }
            return (
              <div
                key={getKey(row)}
                className="rounded-xl border p-3 space-y-2"
                style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
              >
                {visibleColumns.map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                      {col.mobileLabel ?? col.label ?? (typeof col.header === "string" ? col.header : col.key)}
                    </span>
                    <span className="text-right" style={{ color: "var(--text-1)" }}>
                      {col.cell(row)}
                    </span>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ResponsiveTable;
