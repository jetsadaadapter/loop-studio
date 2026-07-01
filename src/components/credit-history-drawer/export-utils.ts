import * as XLSX from "xlsx";
import type { CreditTransaction } from "@/core/services/users.service";
import { TYPE_CONFIG, FALLBACK_CFG } from "./utils";

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const date = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
}

export function exportTransactions(items: CreditTransaction[], format: "xlsx" | "csv") {
  const mappedData = items.map((tx) => {
    const cfg = TYPE_CONFIG[tx.type] ?? FALLBACK_CFG;
    return {
      "Transaction ID": tx.id,
      "Date Time": fmtDateTime(tx.createdAt),
      "Description": tx.description,
      "Type": cfg.label,
      "Source/Client": tx.clientType || "",
      "Reference ID": tx.referenceId || "",
      "Amount": tx.amount,
    };
  });

  const ws = XLSX.utils.json_to_sheet(mappedData);

  if (format === "xlsx") {
    ws["!cols"] = [
      { wch: 25 }, // Transaction ID
      { wch: 20 }, // Date Time
      { wch: 50 }, // Description
      { wch: 15 }, // Type
      { wch: 15 }, // Source/Client
      { wch: 20 }, // Reference ID
      { wch: 10 }, // Amount
    ];
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Credit History");

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `credit_history_${timestamp}.${format}`;

  if (format === "xlsx") {
    XLSX.writeFile(wb, filename, { bookType: "xlsx" });
  } else {
    XLSX.writeFile(wb, filename, { bookType: "csv" });
  }
}
