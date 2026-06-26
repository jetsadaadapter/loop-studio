"use client";

import { useEffect, useState, startTransition } from "react";
import { Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getUserCredits } from "@/core/services/users.service";
import type { ProjectItem } from "@/core/interfaces/projects.interface";

interface ProjectTopUpDialogProps {
  project: ProjectItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedProject: ProjectItem) => void;
  onTopUp: (projectId: string, amount: number) => Promise<{ success: boolean; data: ProjectItem }>;
}

export function ProjectTopUpDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
  onTopUp,
}: ProjectTopUpDialogProps) {
  const [amountStr, setAmountStr] = useState("");
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open) {
      startTransition(() => {
        setErrorMsg("");
        setAmountStr("");
        setIsLoadingCredits(true);
        getUserCredits()
          .then((res) => {
            setUserCredits(res.credits);
          })
          .catch((err) => {
            console.error("Failed to load user credits:", err);
            setErrorMsg("Could not fetch your credit balance.");
          })
          .finally(() => {
            setIsLoadingCredits(false);
          });
      });
    }
  }, [open]);

  if (!project) return null;

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg("Please enter a valid amount greater than 0.");
      return;
    }

    if (userCredits !== null && amount > userCredits) {
      setErrorMsg(`Insufficient credits. You only have ${userCredits.toLocaleString()} credits available.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onTopUp(project.id, amount);
      if (res.success && res.data) {
        onSuccess(res.data);
        onOpenChange(false);
      } else {
        setErrorMsg("Failed to top up credits. Please try again.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] w-full rounded-2xl bg-white border border-slate-200/60 shadow-xl font-sans p-6 select-none">
        <DialogHeader className="space-y-1 pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Coins className="size-5 text-brand" />
            <span>Credit Top-up</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium">
            Transfer credits from your account to project: <span className="font-semibold text-slate-700">{project.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleTopUpSubmit} className="space-y-4 pt-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Your Balance</p>
              {isLoadingCredits ? (
                <Loader2 className="size-4 animate-spin text-slate-400 mt-1" />
              ) : (
                <p className="text-lg font-bold text-slate-800 font-sans mt-0.5">
                  {userCredits !== null ? `${userCredits.toLocaleString()} cr` : "--"}
                </p>
              )}
            </div>
            <div className="text-right border-l border-slate-200 pl-4">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Project Balance</p>
              <p className="text-lg font-bold text-slate-800 font-sans mt-0.5">
                {project.credits.toLocaleString()} cr
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="topup-amount" className="text-xs font-bold text-slate-600">
              Top-up Amount
            </label>
            <div className="relative">
              <Input
                id="topup-amount"
                type="number"
                min="1"
                placeholder="Enter credit amount"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                disabled={isSubmitting || isLoadingCredits}
                className="pr-12 text-sm font-semibold text-slate-800 h-10 rounded-lg border-slate-200/80 focus:border-brand/40"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none select-none">
                credits
              </div>
            </div>
            {errorMsg && (
              <p className="text-xs font-semibold text-red-600 mt-1">{errorMsg}</p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-10 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingCredits || !amountStr}
              className="h-10 text-xs font-bold bg-brand text-white shadow-sm hover:bg-brand-strong cursor-pointer w-full sm:w-auto min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Top-up...
                </>
              ) : (
                "Top-up Now"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
