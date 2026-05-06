import type { ReactNode } from "react";

import type { ManagerTableColumn } from "./types";

type ManagerDataTableProps<T> = {
  rows: T[];
  getRowId: (row: T) => string;
  columns: Array<ManagerTableColumn<T>>;
  emptyText?: string;
  emptyState?: ReactNode;
  isLoading?: boolean;
  loadingRowCount?: number;
};

export function ManagerDataTable<T>({
  rows,
  getRowId,
  columns,
  emptyText = "No data",
  emptyState,
  isLoading = false,
  loadingRowCount = 5,
}: ManagerDataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left font-medium text-slate-600 ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && rows.length === 0 ? (
              Array.from({ length: loadingRowCount }).map((_, rowIndex) => (
                <tr key={`skeleton:${rowIndex}`} className="align-top">
                  {columns.map((column) => (
                    <td
                      key={`skeleton:${rowIndex}:${column.key}`}
                      className={`px-4 py-3 text-slate-800 ${column.className ?? ""}`}
                    >
                      <span className="block h-4 w-full animate-pulse rounded bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  {emptyState ?? emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={getRowId(row)} className="align-top">
                  {columns.map((column) => (
                    <td
                      key={`${getRowId(row)}:${column.key}`}
                      className={`px-4 py-3 text-slate-800 ${column.className ?? ""}`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
