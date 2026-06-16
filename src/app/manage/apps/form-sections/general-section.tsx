"use client";

import { LayoutGrid } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GeneralSectionProps = {
  name: string;
  categoryId: string;
  description: string;
  categories: Array<{ id: string; name: string }>;
  touched: Partial<Record<string, boolean>>;
  fieldErrors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onBlur: (field: string) => void;
};

export function GeneralSection({
  name,
  categoryId,
  description,
  categories,
  touched,
  fieldErrors,
  onChange,
  onBlur,
}: GeneralSectionProps) {
  return (
    <Card className="rounded-xl border border-slate-200/70 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <LayoutGrid className="size-4" />
          </div>
          <div>
            <h5 className="text-base font-semibold leading-tight">General</h5>
            <p className="text-xs text-muted-foreground">App name, category, and description</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field>
          <FieldLabel>
            App Name <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            placeholder="App name"
            value={name}
            onChange={(e) => onChange("name", e.target.value)}
            onBlur={() => onBlur("name")}
          />
          {!(touched.name && fieldErrors.name) && (
            <FieldDescription>
              Must be between 3 and 50 characters.
            </FieldDescription>
          )}
          <FieldError
            errors={touched.name ? [{ message: fieldErrors.name }] : []}
          />
        </Field>

        <Field>
          <FieldLabel>
            Category <span className="text-destructive">*</span>
          </FieldLabel>
          <Select
            value={categoryId}
            onValueChange={(val) => onChange("categoryId", val || "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category">
                {categories.find((cat) => cat.id === categoryId)?.name || ""}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="text-xs">{cat.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError
            errors={
              touched.categoryId ? [{ message: fieldErrors.categoryId }] : []
            }
          />
        </Field>

        <Field>
          <FieldLabel>
            Description <span className="text-destructive">*</span>
          </FieldLabel>
          <textarea
            placeholder="App description"
            value={description}
            onChange={(e) => onChange("description", e.target.value)}
            onBlur={() => onBlur("description")}
            rows={5}
            className="min-h-24 w-full rounded-md border border-input bg-background px-2.5 py-2 text-xs placeholder:text-xs shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 font-(family-name:--font-inter)"
          />
          {!(touched.description && fieldErrors.description) && (
            <FieldDescription>
              Must be between 10 and 500 characters.
            </FieldDescription>
          )}
          <FieldError
            errors={
              touched.description ? [{ message: fieldErrors.description }] : []
            }
          />
        </Field>
      </CardContent>
    </Card>
  );
}
