"use client";

import { useState, useEffect } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ManageRefreshButtonProps {
  lastUpdatedAt?: Date | null;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh: () => void;
  title?: string;
}

export function ManageRefreshButton({ lastUpdatedAt, isLoading = false, isRefreshing = false, onRefresh, title = "Refresh" }: ManageRefreshButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {mounted && lastUpdatedAt && (
        <span className="text-[10px] font-medium text-slate-400">
          Updated {lastUpdatedAt.toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" })}
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={isLoading || isRefreshing}
        onClick={onRefresh}
        className="size-8 border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-3xs flex items-center justify-center shrink-0"
        title={title}
      >
        <RotateCw className={`size-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-brand" : ""}`} />
      </Button>
    </div>
  );
}
