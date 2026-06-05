import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ParamOptionManagerProps {
  options: string[];
  onChange: (options: string[]) => void;
  onOptionRemoved?: (opt: string) => void;
}

export function ParamOptionManager({
  options,
  onChange,
  onOptionRemoved,
}: ParamOptionManagerProps) {
  const [inputValue, setInputValue] = useState("");

  function handleAdd() {
    const trimmed = inputValue.trim();
    if (trimmed && !options.includes(trimmed)) {
      onChange([...options, trimmed]);
      setInputValue("");
    }
  }

  function handleRemove(opt: string) {
    onChange(options.filter((o) => o !== opt));
    if (onOptionRemoved) {
      onOptionRemoved(opt);
    }
  }

  return (
    <div className="space-y-2.5 rounded-xl border border-slate-200/50 bg-white p-3.5 shadow-2xs">
      <Label className="text-xs font-semibold text-slate-700">Options <span className="text-brand">*</span></Label>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="e.g. facebook, instagram (Press Enter to add)"
          className="h-8 text-xs bg-white border-slate-200"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          className="h-8 gap-1 px-3 text-[10px] font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-all"
          onClick={handleAdd}
        >
          <Plus className="size-3" />
          Add
        </Button>
      </div>
      
      {/* Options List */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {options.map((opt) => (
          <span
            key={opt}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-0.5 pr-1.5 text-xs font-semibold text-slate-650 border border-slate-200/60 shadow-3xs animate-fade-in"
          >
            {opt}
            <button
              type="button"
              onClick={() => handleRemove(opt)}
              className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-0.5 rounded-full transition-all size-4 flex items-center justify-center"
              title="Remove option"
            >
              <X className="size-2.5" />
            </button>
          </span>
        ))}
        {options.length === 0 && (
          <span className="text-[10px] text-slate-400 font-medium italic mt-0.5 block select-none">
            No options defined. Please add at least one option to save.
          </span>
        )}
      </div>
    </div>
  );
}
