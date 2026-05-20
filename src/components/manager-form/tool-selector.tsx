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
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

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

  useEffect(() => {
    getManageTools()
      .then(setTools)
      .catch(() => setTools([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Field>
      <FieldLabel>
        Select Tool <span className="text-destructive">*</span>
      </FieldLabel>
      <Select
        value={value}
        onValueChange={(val) => onChange(val)}
        disabled={loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={loading ? "Loading tools..." : "Select a tool"}
          />
        </SelectTrigger>
        <SelectContent align="start">
          {tools.map((tool) => (
            <SelectItem
              key={tool.id}
              value={tool.id}
              className="flex flex-col items-start"
            >
              <span className="font-medium">{tool.name}</span>
              <span className="text-xs text-slate-500">{tool.id}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError errors={touched ? [{ message: error }] : []} />
    </Field>
  );
}
