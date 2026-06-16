"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getManageTools } from "@/core/services/manage-tools.service";
import { ManageToolApiItem } from "@/core/interfaces/tool";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";

interface ToolSelectorProps {
  value: string;
  onChange: (toolId: string | null) => void;
  touched?: boolean;
  error?: string;
}

export function ToolSelector({
  value,
  onChange,
  touched,
  error,
}: ToolSelectorProps) {
  const [tools, setTools] = useState<ManageToolApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedTool = tools.find((t) => t.id === value);

  useEffect(() => {
    getManageTools()
      .then(setTools)
      .catch(() => setTools([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Field>
      <FieldLabel>
        CTA Link <span className="text-destructive">*</span>
      </FieldLabel>
      <Select
        value={value}
        onValueChange={(val) => onChange(val)}
        disabled={loading}
      >
        <SelectTrigger className="w-full">
          {selectedTool ? (
            <span className="text-xs font-medium truncate">
              {selectedTool.name}
            </span>
          ) : (
            <SelectValue
              placeholder={loading ? "Loading tools..." : "Select a tool"}
            />
          )}
        </SelectTrigger>
        <SelectContent align="start" className="max-w-xs sm:max-w-sm">
          {tools.map((tool) => (
            <SelectItem
              key={tool.id}
              value={tool.id}
              className="py-2"
            >
              <div className="flex flex-col gap-0.5 min-w-0 overflow-hidden pr-2">
                <span className="text-xs font-medium leading-snug truncate">
                  {tool.name}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono leading-snug truncate">
                  {tool.id}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!(touched && error) && (
        <FieldDescription>
          เลือก Tool ที่ต้องการลิงก์ไป (ระบบจะสร้างลิงก์เป็น /tool/รหัสเครื่องมืออัตโนมัติ)
        </FieldDescription>
      )}
      <FieldError errors={touched ? [{ message: error }] : []} />
    </Field>
  );
}
