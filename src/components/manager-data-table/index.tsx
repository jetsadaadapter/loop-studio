import type { ReactNode } from "react";
import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

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
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`px-4 ${column.className ?? ""}`}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && rows.length === 0 ? (
            Array.from({ length: loadingRowCount }).map((_, rowIndex) => (
              <TableRow key={`skeleton:${rowIndex}`}>
                {columns.map((column) => (
                  <TableCell
                    key={`skeleton:${rowIndex}:${column.key}`}
                    className={`px-4 ${column.className ?? ""}`}
                  >
                    <span className="block h-4 w-full animate-pulse rounded bg-slate-100" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="px-4 py-8 text-center text-slate-500"
              >
                {emptyState ?? emptyText}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={getRowId(row)}>
                {columns.map((column) => (
                  <TableCell
                    key={`${getRowId(row)}:${column.key}`}
                    className={`px-4 ${column.className ?? ""}`}
                  >
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
