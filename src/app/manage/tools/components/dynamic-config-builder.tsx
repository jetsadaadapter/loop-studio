"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConfigParamRow {
  id: string;
  key: string;
  type: "string" | "number" | "boolean" | "json";
  value: unknown;
}

interface DynamicConfigBuilderProps {
  label: string;
  value: Record<string, unknown>;
  onChange: (updated: Record<string, unknown>) => void;
  excludeKeys?: string[];
}

export function DynamicConfigBuilder({
  label,
  value,
  onChange,
  excludeKeys = [],
}: DynamicConfigBuilderProps) {
  const [rows, setRows] = useState<ConfigParamRow[]>(() => {
    return Object.entries(value || {})
      .filter(([key]) => !excludeKeys.includes(key))
      .map(([key, val]) => {
        let type: "string" | "number" | "boolean" | "json" = "string";
        if (typeof val === "boolean") type = "boolean";
        else if (typeof val === "number") type = "number";
        else if (typeof val === "object" && val !== null) type = "json";
        return {
          id: crypto.randomUUID(),
          key,
          type,
          value: type === "json" ? JSON.stringify(val, null, 2) : val,
        };
      });
  });

  function notifyChange(nextRows: ConfigParamRow[]) {
    const obj: Record<string, unknown> = {};

    // Preserve excluded keys from original value
    excludeKeys.forEach((k) => {
      if (value && value[k] !== undefined) {
        obj[k] = value[k];
      }
    });

    nextRows.forEach((r) => {
      const trimmedKey = r.key.trim();
      if (!trimmedKey) return;

      if (r.type === "boolean") {
        obj[trimmedKey] = typeof r.value === "boolean" ? r.value : r.value === "true" || r.value === true;
      } else if (r.type === "number") {
        const num = Number(r.value);
        obj[trimmedKey] = isNaN(num) ? 0 : num;
      } else if (r.type === "json") {
        try {
          obj[trimmedKey] = JSON.parse(r.value as string);
        } catch {
          obj[trimmedKey] = r.value;
        }
      } else {
        obj[trimmedKey] = String(r.value);
      }
    });

    onChange(obj);
  }

  function addRow() {
    const next = [
      ...rows,
      { id: crypto.randomUUID(), key: "", type: "string" as const, value: "" },
    ];
    setRows(next);
  }

  function updateRow(idx: number, partial: Partial<ConfigParamRow>) {
    const next = [...rows];
    const target = { ...next[idx], ...partial };

    // Reset value if type is changed to ensure correct typing defaults
    if (partial.type) {
      if (partial.type === "boolean") target.value = false;
      else if (partial.type === "number") target.value = 0;
      else if (partial.type === "json") target.value = "{}";
      else target.value = "";
    }

    next[idx] = target;
    setRows(next);
    notifyChange(next);
  }

  function deleteRow(idx: number) {
    const next = rows.filter((_, i) => i !== idx);
    setRows(next);
    notifyChange(next);
  }

  return (
    <div className="space-y-2.5 pt-3 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addRow}
          className="h-6 px-2 text-[10px] font-bold text-slate-500 hover:text-slate-900 border border-slate-200/60 bg-white"
        >
          <Plus className="size-3 mr-1" /> Add Field
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-[10px] italic text-slate-400 pl-1">No custom fields defined</p>
      ) : (
        <div className="space-y-3 pl-1">
          {rows.map((row, idx) => {
            const isJson = row.type === "json";
            return (
              <div
                key={row.id}
                className="flex flex-col gap-2 p-2.5 bg-white border border-slate-200/50 rounded-lg shadow-2xs hover:shadow-3xs transition-shadow"
              >
                {/* Row Header: Key, Type Select, Delete */}
                <div className="flex items-center gap-2">
                  <Input
                    value={row.key}
                    onChange={(e) => updateRow(idx, { key: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })}
                    placeholder="Parameter key"
                    className="h-8 text-xs md:text-xs bg-slate-50/50 border-slate-200 flex-1 font-sans "
                  />

                  <Select
                    value={row.type}
                    onValueChange={(val) => { if (val !== null) updateRow(idx, { type: val }); }}
                  >
                    <SelectTrigger className="h-8 w-[90px] bg-slate-50/50 border-slate-200 text-xs  py-1 px-2.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string" className="text-xs">String</SelectItem>
                      <SelectItem value="number" className="text-xs">Number</SelectItem>
                      <SelectItem value="boolean" className="text-xs">Boolean</SelectItem>
                      <SelectItem value="json" className="text-xs">JSON</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRow(idx)}
                    className="size-8 text-slate-400 hover:text-brand hover:bg-brand/5 rounded-md shrink-0"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                {/* Row Value Input based on selected Type */}
                <div className="flex-1 pl-0.5">
                  {row.type === "boolean" ? (
                    <div className="flex items-center gap-2 py-1">
                      <Switch
                        checked={row.value === true || row.value === "true"}
                        onCheckedChange={(checked) => updateRow(idx, { value: checked })}
                      />
                      <span className="text-[10px]  text-slate-500 font-sans">
                        {String(row.value)}
                      </span>
                    </div>
                  ) : isJson ? (
                    <Textarea
                      value={(row.value as string) || ""}
                      onChange={(e) => updateRow(idx, { value: e.target.value })}
                      placeholder='{ "key": "value" }'
                      className="font-sans text-[10px] bg-slate-50/20 border-slate-200 focus-visible:ring-brand focus-visible:border-brand"
                      rows={3}
                    />
                  ) : (
                    <Input
                      type={row.type === "number" ? "number" : "text"}
                      value={row.value !== undefined && row.value !== null ? String(row.value) : ""}
                      onChange={(e) => updateRow(idx, { value: e.target.value })}
                      placeholder="Parameter value"
                      className="h-8 text-xs md:text-xs bg-slate-50/20 border-slate-200 "
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
