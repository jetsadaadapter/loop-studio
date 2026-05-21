"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronDown, Check, HelpCircle } from "lucide-react";
import { createPortal } from "react-dom";

interface ExportFieldSelectorProps {
  label: string;
  selected: string[];
  onChange: (selected: string[]) => void;
  allKeys: string[];
  placeholder?: string;
}

export function ExportFieldSelector({
  label,
  selected,
  onChange,
  allKeys,
  placeholder = "Select...",
}: ExportFieldSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredKeys = allKeys.filter((k) =>
    k.toLowerCase().includes(search.toLowerCase())
  );

  const toggleField = (field: string) => {
    const isPresent = selected.includes(field);
    const updated = isPresent
      ? selected.filter((f) => f !== field)
      : [...selected, field];
    onChange(updated);
  };

  const handleClear = () => {
    onChange([]);
    setSearch("");
  };

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setIsOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <div className="space-y-1.5 w-full select-none text-xs font-semibold text-slate-650">
      <label className="text-slate-700 font-semibold text-xs flex items-center gap-1">
        <span>{label}</span>
        <HelpCircle className="size-3.5 text-slate-400 cursor-help" />
      </label>

      {/* Tag Input Box */}
      <div
        ref={triggerRef}
        onClick={openDropdown}
        className={`w-full min-h-[38px] bg-white border rounded-lg p-1.5 flex flex-wrap items-center gap-1.5 cursor-text relative shadow-xs pr-14 transition-colors ${
          isOpen
            ? "border-brand ring-2 ring-brand/10"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        {selected.map((k) => (
          <span
            key={k}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-md text-[10.5px] font-mono transition-colors"
          >
            <span>{k}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleField(k);
              }}
              className="p-0.5 rounded hover:bg-slate-300 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}

        <input
          type="text"
          placeholder={selected.length === 0 ? placeholder : ""}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) openDropdown();
          }}
          onFocus={openDropdown}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-[60px] bg-transparent border-none outline-none focus:ring-0 p-0 text-xs font-mono font-semibold text-slate-750 placeholder-slate-400"
        />

        {/* Right side controls */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
          <ChevronDown
            className={`size-4 text-slate-400 transition-transform duration-150 cursor-pointer ${
              isOpen ? "rotate-180 text-slate-600" : ""
            }`}
          />
        </div>
      </div>

      {/* Portal Dropdown */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 9999,
            }}
            className="bg-white border border-slate-200 rounded-lg shadow-2xl max-h-52 overflow-y-auto p-1.5"
          >
            {filteredKeys.length === 0 && (
              <p className="text-slate-400 p-2 text-center text-xs">
                No fields found
              </p>
            )}
            {filteredKeys.map((k) => {
              const isSelected = selected.includes(k);
              return (
                <button
                  type="button"
                  key={`option-${k}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toggleField(k);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-mono font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-brand/5 text-brand"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{k}</span>
                  {isSelected && (
                    <Check className="size-3.5 text-brand animate-in fade-in zoom-in-75 duration-100" />
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
