"use client";

import { useEffect, useState, startTransition } from "react";
import { Coins, Loader2, Wallet, Building2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getUserCredits } from "@/core/services/users.service";
import type { ProjectItem } from "@/core/interfaces/projects.interface";

const QUICK_AMOUNTS = [10, 50, 100, 500];
const QUICK_DESCRIPTIONS = ["Monthly top-up", "Bonus reward", "Correction", "Refund"];

interface ProjectTopUpDialogProps {
  project: ProjectItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedProject?: ProjectItem) => void;
  onTopUp: (projectId: string, amount: number, description?: string) => Promise<{ success: boolean; data?: ProjectItem }>;
}

export function ProjectTopUpDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
  onTopUp,
}: ProjectTopUpDialogProps) {
  const [amountStr, setAmountStr] = useState("");
  const [descriptionStr, setDescriptionStr] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [descTouched, setDescTouched] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open) {
      startTransition(() => {
        setErrorMsg("");
        setAmountStr("");
        setDescriptionStr("");
        setAmountTouched(false);
        setDescTouched(false);
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

  const amount = parseInt(amountStr, 10);
  const amountError = amountTouched
    ? !amountStr
      ? "Amount is required."
      : isNaN(amount) || amount <= 0
      ? "Enter a valid amount greater than 0."
      : ""
    : "";

  const descError = descTouched && !descriptionStr.trim()
    ? "Description is required."
    : "";

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAmountTouched(true);
    setDescTouched(true);
    setErrorMsg("");

    const isAmountValid = !isNaN(amount) && amount > 0;
    const isDescValid = descriptionStr.trim().length > 0;

    if (!isAmountValid || !isDescValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onTopUp(project.id, amount, descriptionStr.trim());
      if (res.success) {
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
          <DialogTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Coins className="size-5 text-brand" />
            <span>Credit Top-up</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium">
            Transfer credits from your account to project: <span className="font-semibold text-slate-700">{project.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleTopUpSubmit} className="space-y-4 pt-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-red-50/60 border border-brand/10 shadow-sm p-4 select-none">
            <div className="absolute -right-8 -top-8 size-28 rounded-full bg-brand/10 blur-2xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 size-24 rounded-full bg-brand/5 blur-2xl pointer-events-none" />

            <div className="relative flex items-center justify-between gap-2">
              <div className="flex-1 text-center">
                <div className="inline-flex items-center justify-center size-8 rounded-full bg-slate-200/70 text-slate-500 mb-1.5">
                  <Wallet className="size-4" />
                </div>
                {isLoadingCredits ? (
                  <div className="flex justify-center items-center h-9">
                    <Loader2 className="size-4 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <p className="text-2xl font-extrabold text-slate-800 font-sans tracking-tight">
                    {userCredits !== null ? userCredits.toLocaleString() : "--"}
                    <span className="text-xs font-semibold text-slate-400 ml-1">cr</span>
                  </p>
                )}
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">Your Balance</p>
              </div>

              <div className="flex items-center justify-center size-9 rounded-full bg-brand text-white shadow-md shadow-brand/30 shrink-0">
                <ArrowRight className="size-4" />
              </div>

              <div className="flex-1 text-center">
                <div className="inline-flex items-center justify-center size-8 rounded-full bg-brand/10 text-brand mb-1.5">
                  <Building2 className="size-4" />
                </div>
                <p className="text-2xl font-extrabold text-brand font-sans tracking-tight">
                  {project.credits.toLocaleString()}
                  <span className="text-xs font-semibold text-brand/50 ml-1">cr</span>
                </p>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">Project Balance</p>
              </div>
            </div>
          </div>

          <Field>
            <FieldLabel htmlFor="topup-amount">
              Top-up Amount <span className="text-destructive">*</span>
            </FieldLabel>
            <div className="relative">
              <Input
                id="topup-amount"
                type="number"
                min="1"
                placeholder="Enter credit amount"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                onBlur={() => setAmountTouched(true)}
                disabled={isSubmitting || isLoadingCredits}
                className="pr-12"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none select-none font-sans">
                credits
              </div>
            </div>
            {/* Quick amounts */}
            <div className="flex gap-1.5 flex-wrap mt-1 select-none">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setAmountStr(String(q));
                    setAmountTouched(true);
                  }}
                  disabled={isSubmitting || isLoadingCredits}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                    amountStr === String(q)
                      ? "bg-brand text-white border-brand"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-brand/40 hover:text-brand"
                  }`}
                >
                  +{q}
                </button>
              ))}
            </div>
            <FieldDescription>
              Enter the amount of credits to transfer from your balance to this project.
            </FieldDescription>
            <FieldError errors={amountError ? [{ message: amountError }] : []} />
          </Field>

          <Field>
            <FieldLabel htmlFor="topup-desc">
              Description <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="topup-desc"
              type="text"
              placeholder="e.g. Monthly top-up"
              value={descriptionStr}
              onChange={(e) => setDescriptionStr(e.target.value)}
              onBlur={() => setDescTouched(true)}
              disabled={isSubmitting || isLoadingCredits}
            />
            {/* Quick descriptions */}
            <div className="flex gap-1.5 flex-wrap mt-1 select-none">
              {QUICK_DESCRIPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDescriptionStr(d);
                    setDescTouched(true);
                  }}
                  disabled={isSubmitting || isLoadingCredits}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all cursor-pointer ${
                    descriptionStr === d
                      ? "bg-slate-700 text-white border-slate-700"
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <FieldDescription>
              Provide a brief description or reference note for this credit transaction.
            </FieldDescription>
            <FieldError errors={descError ? [{ message: descError }] : []} />
          </Field>

          {errorMsg && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-650 border border-red-100 font-medium">
              {errorMsg}
            </p>
          )}

          <div className="pt-2 border-t border-slate-100 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-9 cursor-pointer rounded-sm border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingCredits || !amountStr}
              className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-sm bg-brand px-5 text-xs font-semibold text-white shadow-sm shadow-brand/10 transition-all hover:bg-brand/90 disabled:opacity-60 w-full sm:w-auto min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Top-up...</span>
                </>
              ) : (
                "Top-up Now"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
