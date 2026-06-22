"use client";

import { useState } from "react";
import { Coins, Loader2, Minus, Plus, X } from "lucide-react";
import type { UserProfile } from "@/core/interfaces/auth.interface";

interface UserCreditModalProps {
  user: UserProfile;
  isSubmitting: boolean;
  submitError: string;
  onSubmit: (amount: number, description: string) => void;
  onClose: () => void;
}

const QUICK_AMOUNTS = [10, 50, 100, 500];
const QUICK_DESCRIPTIONS = ["Monthly top-up", "Bonus reward", "Correction", "Refund"];

export function UserCreditModal({ user, isSubmitting, submitError, onSubmit, onClose }: UserCreditModalProps) {
  const [mode, setMode] = useState<"add" | "deduct">("add");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState(false);

  const amountNum = parseInt(amount, 10);
  const isValid = !isNaN(amountNum) && amountNum > 0 && description.trim().length > 0;
  const finalAmount = mode === "add" ? amountNum : -amountNum;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit(finalAmount, description.trim());
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "User";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200/60 bg-white shadow-xl shadow-slate-900/10">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <Coins className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Adjust Credits</h2>
              <p className="text-[10px] text-slate-400 font-sans">{displayName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

          {/* Add / Deduct toggle */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 gap-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setMode("add")}
              className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                mode === "add" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Plus className="size-3.5" /> Add Credits
            </button>
            <button
              type="button"
              onClick={() => setMode("deduct")}
              className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                mode === "deduct" ? "bg-rose-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Minus className="size-3.5" /> Deduct Credits
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Amount <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold ${mode === "add" ? "text-emerald-600" : "text-rose-500"}`}>
                {mode === "add" ? "+" : "−"}
              </span>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="0"
                className="w-full h-10 pl-8 pr-3 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-800 outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10 transition-all"
              />
            </div>
            {/* Quick amounts */}
            <div className="flex gap-1.5 flex-wrap">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                    amount === String(q)
                      ? "bg-brand text-white border-brand"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-brand/40 hover:text-brand"
                  }`}
                >
                  {mode === "add" ? "+" : "−"}{q}
                </button>
              ))}
            </div>
            {touched && isNaN(amountNum) || (touched && amountNum <= 0) ? (
              <p className="text-[10px] text-rose-500 font-medium">Enter a valid amount greater than 0</p>
            ) : null}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly top-up"
              maxLength={100}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10 transition-all"
            />
            {/* Quick descriptions */}
            <div className="flex gap-1.5 flex-wrap">
              {QUICK_DESCRIPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDescription(d)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all cursor-pointer ${
                    description === d
                      ? "bg-slate-700 text-white border-slate-700"
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            {touched && !description.trim() && (
              <p className="text-[10px] text-rose-500 font-medium">Description is required</p>
            )}
          </div>

          {/* Preview */}
          {isValid && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 border text-xs font-medium ${
              mode === "add" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
            }`}>
              <Coins className="size-3.5 shrink-0" />
              <span>
                {mode === "add" ? "Adding" : "Deducting"} <strong>{amountNum}</strong> credits
                {description ? ` — ${description}` : ""}
              </span>
            </div>
          )}

          {submitError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 border border-rose-100">{submitError}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-9 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (touched && !isValid)}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm ${
                mode === "add" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
              }`}
            >
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {isSubmitting ? "Saving…" : mode === "add" ? "Add Credits" : "Deduct Credits"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
