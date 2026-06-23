import { useVirtualizer } from "@tanstack/react-virtual";
import type { ReactNode } from "react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  width?: string;
};

export function DataGrid<T>({ rows, columns }: { rows: T[]; columns: Column<T>[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const gridTemplateColumns = columns.map((column) => column.width ?? "minmax(0, 1fr)").join(" ");
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 58,
    overscan: 8,
  });

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div
        className="grid gap-x-5 border-b border-border bg-muted px-4 py-3 text-xs font-semibold uppercase text-muted-foreground"
        style={{ gridTemplateColumns }}
      >
        {columns.map((column) => (
          <div className={column.className} key={column.key}>{column.header}</div>
        ))}
      </div>
      <div ref={parentRef} className="h-[520px] overflow-auto">
        <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                className="absolute left-0 grid w-full items-center gap-x-5 border-b border-border px-4 text-sm"
                style={{
                  gridTemplateColumns,
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {columns.map((column) => (
                  <div className={cn("truncate pr-3", column.className)} key={column.key}>
                    {column.cell(row)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
