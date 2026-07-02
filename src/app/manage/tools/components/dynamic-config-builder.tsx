"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// ArrayValueInput — for string[] values
// ---------------------------------------------------------------------------
function ArrayValueInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (val: string[]) => void;
}) {
  const [inputVal, setInputVal] = useState("");

  const handleAdd = () => {
    const trimmed = inputVal.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputVal("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (itemToRemove: string) => {
    onChange(value.filter((item) => item !== itemToRemove));
  };

  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex flex-wrap gap-1 min-h-[30px] p-1.5 bg-slate-50/50 border border-slate-200/50 rounded-sm">
        {value.length === 0 ? (
          <span className="text-[10px] text-slate-400 self-center pl-1 italic font-sans">
            No items. Type and press Add/Enter.
          </span>
        ) : (
          value.map((item, idx) => (
            <span
              key={`${item}-${idx}`}
              className="inline-flex items-center gap-1 bg-brand/5 text-brand border border-brand/10 rounded-md px-1.5 py-0.5 text-[10px] font-medium font-sans"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="hover:text-brand-strong transition-colors size-3 flex items-center justify-center rounded-full hover:bg-brand/10 font-bold"
              >
                &times;
              </button>
            </span>
          ))
        )}
      </div>
      <div className="flex gap-1.5">
        <Input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type item..."
          className="h-7 text-xs font-sans placeholder:text-xs placeholder:font-sans bg-slate-50/20 border-slate-200 flex-1"
        />
        <Button
          type="button"
          onClick={handleAdd}
          variant="outline"
          className="h-7 px-2 text-[10px] font-bold text-slate-650 border-slate-200 hover:bg-slate-50"
        >
          Add
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AutoResizeTextarea — grows to fit content on mount and on each keystroke
// ---------------------------------------------------------------------------
function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className,
  spellCheck,
  minRows = 3,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  spellCheck?: boolean;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  // Set height from existing content on mount
  useEffect(() => {
    if (ref.current) resize(ref.current);
  }, []);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      onInput={(e) => resize(e.currentTarget)}
      placeholder={placeholder}
      spellCheck={spellCheck}
      rows={minRows}
      className={className}
      style={{ overflow: "hidden", resize: "none" }}
    />
  );
}

// ---------------------------------------------------------------------------
// ArrayObjectInput — for Record<string,unknown>[] values (JSON textarea)
// ---------------------------------------------------------------------------
function ArrayObjectInput({
  value,
  onChange,
}: {
  value: Record<string, unknown>[];
  onChange: (val: Record<string, unknown>[]) => void;
}) {
  const [rawJson, setRawJson] = useState(() => JSON.stringify(value, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);

  const handleChange = (text: string) => {
    setRawJson(text);
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        setParseError(null);
        onChange(parsed as Record<string, unknown>[]);
      } else {
        setParseError("Value must be a JSON array [ … ]");
      }
    } catch {
      setParseError("Invalid JSON");
    }
  };

  return (
    <div className="space-y-1 mt-1">
      <AutoResizeTextarea
        value={rawJson}
        onChange={(e) => handleChange(e.target.value)}
        placeholder='[{ "key1": "value1", "key2": "value2" }]'
        className="font-sans text-[10px] bg-slate-50/20 border-slate-200 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:border-brand min-h-[80px] w-full px-3 py-2"
        minRows={4}
        spellCheck={false}
      />
      {parseError && (
        <p className="text-[10px] text-rose-500 font-sans">{parseError}</p>
      )}
      <p className="text-[10px] text-slate-400 font-sans italic">
        Edit as JSON array of objects.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ConfigRowType =
  | "string"
  | "number"
  | "boolean"
  | "json"
  | "array"
  | "array_of_objects";

interface ConfigParamRow {
  id: string;
  key: string;
  type: ConfigRowType;
  value: unknown;
}

interface DynamicConfigBuilderProps {
  label: string;
  value: Record<string, unknown>;
  onChange: (updated: Record<string, unknown>) => void;
  excludeKeys?: string[];
}

// ---------------------------------------------------------------------------
// DynamicConfigBuilder
// ---------------------------------------------------------------------------
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
        let type: ConfigRowType = "string";
        if (typeof val === "boolean") {
          type = "boolean";
        } else if (typeof val === "number") {
          type = "number";
        } else if (Array.isArray(val)) {
          // Detect array-of-objects: first element is a non-null, non-array object
          if (
            val.length > 0 &&
            typeof val[0] === "object" &&
            val[0] !== null &&
            !Array.isArray(val[0])
          ) {
            type = "array_of_objects";
          } else {
            type = "array";
          }
        } else if (typeof val === "object" && val !== null) {
          type = "json";
        }

        if (type === "json") {
          return {
            id: crypto.randomUUID(),
            key,
            type,
            value: JSON.stringify(val, null, 2),
          };
        }
        // array_of_objects and array: keep raw value
        return { id: crypto.randomUUID(), key, type, value: val };
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
        obj[trimmedKey] =
          typeof r.value === "boolean"
            ? r.value
            : r.value === "true" || r.value === true;
      } else if (r.type === "number") {
        const num = Number(r.value);
        obj[trimmedKey] = isNaN(num) ? 0 : num;
      } else if (r.type === "json") {
        try {
          obj[trimmedKey] = JSON.parse(r.value as string);
        } catch {
          obj[trimmedKey] = r.value;
        }
      } else if (r.type === "array" || r.type === "array_of_objects") {
        obj[trimmedKey] = Array.isArray(r.value) ? r.value : [];
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

    // Only apply type-specific defaults if the value is currently an empty string.
    // Otherwise, preserve the existing value so users don't lose data when swapping types.
    if (partial.type && partial.type !== next[idx].type) {
      if (target.value === "") {
        if (partial.type === "boolean") target.value = false;
        else if (partial.type === "number") target.value = 0;
        else if (partial.type === "json") target.value = "{}";
        else if (partial.type === "array") target.value = [];
        else if (partial.type === "array_of_objects") target.value = [{}];
      }
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
        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </Label>
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
        <p className="text-[10px] italic text-slate-400 pl-1">
          No custom fields defined
        </p>
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
                    onChange={(e) =>
                      updateRow(idx, {
                        key: e.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
                      })
                    }
                    placeholder="Parameter key"
                    className="h-8 text-xs md:text-xs bg-slate-50/50 border-slate-200 flex-1 font-sans"
                  />

                  <Select
                    value={row.type}
                    onValueChange={(val) => {
                      if (val !== null)
                        updateRow(idx, { type: val as ConfigRowType });
                    }}
                  >
                    <SelectTrigger className="h-8 w-[110px] bg-slate-50/50 border-slate-200 text-xs py-1 px-2.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string" className="text-xs">
                        String
                      </SelectItem>
                      <SelectItem value="number" className="text-xs">
                        Number
                      </SelectItem>
                      <SelectItem value="boolean" className="text-xs">
                        Boolean
                      </SelectItem>
                      <SelectItem value="array" className="text-xs">
                        Array
                      </SelectItem>
                      <SelectItem value="array_of_objects" className="text-xs">
                        Array[&#123;&#125;]
                      </SelectItem>
                      <SelectItem value="json" className="text-xs">
                        JSON
                      </SelectItem>
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
                        checked={
                          row.value === true || row.value === "true"
                        }
                        onCheckedChange={(checked) =>
                          updateRow(idx, { value: checked })
                        }
                      />
                      <span className="text-[10px] text-slate-500 font-sans">
                        {String(row.value)}
                      </span>
                    </div>
                  ) : isJson ? (
                    <AutoResizeTextarea
                      value={
                        typeof row.value === "string"
                          ? row.value
                          : JSON.stringify(row.value, null, 2)
                      }
                      onChange={(e) =>
                        updateRow(idx, { value: e.target.value })
                      }
                      placeholder='{ "key": "value" }'
                      className="font-sans text-[10px] bg-slate-50/20 border-slate-200 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:border-brand min-h-[60px] w-full px-3 py-2"
                      minRows={3}
                    />
                  ) : row.type === "array" ? (
                    <ArrayValueInput
                      value={
                        Array.isArray(row.value)
                          ? (row.value as unknown[]).filter(
                              (v) => typeof v === "string"
                            ) as string[]
                          : []
                      }
                      onChange={(val) => updateRow(idx, { value: val })}
                    />
                  ) : row.type === "array_of_objects" ? (
                    <ArrayObjectInput
                      value={
                        Array.isArray(row.value)
                          ? (row.value as Record<string, unknown>[])
                          : []
                      }
                      onChange={(val) => updateRow(idx, { value: val })}
                    />
                  ) : (
                    <Input
                      type={row.type === "number" ? "number" : "text"}
                      value={
                        row.value !== undefined && row.value !== null
                          ? typeof row.value === "object"
                            ? JSON.stringify(row.value)
                            : String(row.value)
                          : ""
                      }
                      onChange={(e) =>
                        updateRow(idx, { value: e.target.value })
                      }
                      placeholder="Parameter value"
                      className="h-8 text-xs md:text-xs bg-slate-50/20 border-slate-200"
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
