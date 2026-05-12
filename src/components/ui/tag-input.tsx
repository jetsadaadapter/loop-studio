"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  strictSuggestions?: boolean;
  placeholder?: string;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  strictSuggestions = false,
  placeholder = "Add tags...",
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);

  const normalizedSuggestions = React.useMemo(
    () => [...new Set(suggestions.map((tag) => tag.trim()).filter(Boolean))],
    [suggestions],
  );

  const suggestionByLower = React.useMemo(
    () =>
      Object.fromEntries(
        normalizedSuggestions.map((tag) => [tag.toLowerCase(), tag]),
      ),
    [normalizedSuggestions],
  );

  const selectedTagSet = React.useMemo(
    () => new Set(value.map((tag) => tag.toLowerCase())),
    [value],
  );

  const filteredSuggestions = React.useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    return normalizedSuggestions.filter((tag) => {
      const lowerTag = tag.toLowerCase();
      if (selectedTagSet.has(lowerTag)) return false;
      if (!query) return true;
      return lowerTag.includes(query);
    });
  }, [inputValue, normalizedSuggestions, selectedTagSet]);

  const canShowSuggestions = isFocused && filteredSuggestions.length > 0;

  const addTag = (rawTag: string): boolean => {
    const trimmed = rawTag.trim();
    if (!trimmed) return false;

    const canonicalTag = suggestionByLower[trimmed.toLowerCase()] ?? trimmed;

    if (strictSuggestions && !suggestionByLower[trimmed.toLowerCase()]) {
      return false;
    }

    if (!selectedTagSet.has(canonicalTag.toLowerCase())) {
      onChange([...value, canonicalTag]);
      return true;
    }

    return false;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      const added = addTag(inputValue);
      if (added) {
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex min-h-10 w-full flex-wrap gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-within:ring-1 focus-within:ring-brand focus-within:ring-offset-0",
          className,
        )}
      >
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1 border-none bg-slate-100 px-2 py-1 text-slate-900 hover:bg-slate-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove tag ${tag}`}
              title={`Remove tag ${tag}`}
              className="ml-1 rounded-full outline-none focus:ring-1 focus:ring-slate-400"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 100)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent outline-none placeholder:text-slate-500"
        />
      </div>

      {canShowSuggestions ? (
        <div className="max-h-40 overflow-auto rounded-sm border border-slate-200 bg-white p-1">
          {filteredSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (addTag(tag)) setInputValue("");
              }}
              className="block w-full rounded-sm px-2 py-1 text-left text-sm text-slate-700 hover:bg-slate-100"
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
