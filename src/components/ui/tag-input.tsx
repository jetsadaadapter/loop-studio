"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  strictSuggestions?: boolean;
  placeholder?: string;
  className?: string;
  helperText?: string;
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  strictSuggestions = false,
  placeholder = "Add tags...",
  className,
  helperText,
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
    <div className="relative space-y-1.5">
      <div
        className={cn(
          "flex min-h-8 w-full flex-wrap items-center gap-1 rounded-sm border border-input bg-transparent px-2.5 py-1 text-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          className,
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center rounded-full text-primary bg-primary/5 px-2 py-0.5"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove tag ${tag}`}
              title={`Remove tag ${tag}`}
              className="ml-1 rounded-full text-slate-500 outline-none transition hover:text-slate-700 focus:ring-1 focus:ring-slate-300"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 100)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-30 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {helperText ? (
        <small className="text-xs text-muted-foreground">{helperText}</small>
      ) : null}

      {canShowSuggestions ? (
        <div className="max-h-40 overflow-auto rounded-md border border-input bg-background p-1 shadow-sm">
          {filteredSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (addTag(tag)) setInputValue("");
              }}
              className="block w-full rounded-sm px-2 py-1 text-left text-sm text-foreground hover:bg-muted"
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
