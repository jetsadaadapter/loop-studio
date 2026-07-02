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

interface ParamDefaultValueInputProps {
  _localId: string;
  defaultValue: string;
  onChange: (val: string) => void;
  defaultValueType: "text" | "number" | "boolean" | "textarea" | "select" | "date" | "json";
  options?: string[];
}

export function ParamDefaultValueInput({
  _localId,
  defaultValue,
  onChange,
  defaultValueType,
  options = [],
}: ParamDefaultValueInputProps) {
  if (defaultValueType === "boolean") {
    const isChecked = defaultValue === "true";
    return (
      <div className="flex items-center gap-2.5 h-8">
        <Switch
          id={`def-${_localId}`}
          checked={isChecked}
          onCheckedChange={(checked) => onChange(String(checked))}
        />
        <Label htmlFor={`def-${_localId}`} className="cursor-pointer text-xs font-semibold text-slate-650">
          {isChecked ? "Enabled" : "Disabled"}
        </Label>
      </div>
    );
  }

  if (defaultValueType === "textarea" || defaultValueType === "json") {
    return (
      <textarea
        value={defaultValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          defaultValueType === "json"
            ? 'e.g. { "url": "https://example.com" }'
            : "Enter default multiline text..."
        }
        className="w-full min-h-16 py-2 px-3 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand rounded-lg text-xs font-medium resize-none shadow-2xs hover:border-slate-300"
      />
    );
  }

  if (defaultValueType === "select") {
    return (
      <Select value={defaultValue || "none"} onValueChange={(val) => onChange(val === null || val === "none" ? "" : val)}>
        <SelectTrigger className="h-8 bg-white border-slate-200 text-xs">
          <SelectValue placeholder="Select default option..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" className="text-xs font-medium text-slate-400">
            No default value
          </SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt} className="text-xs">
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      type={
        defaultValueType === "number"
          ? "number"
          : defaultValueType === "date"
          ? "date"
          : "text"
      }
      value={defaultValue}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Optional default parameter value"
      className="h-8 bg-white border-slate-200 text-xs"
    />
  );
}
