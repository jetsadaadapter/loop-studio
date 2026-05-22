"use client";

import type { ToolParam } from "@/core/interfaces/tools.interface";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UrlArrayInput } from "../url-array-input";
import {
  ListOrdered,
  List,
  CornerDownLeft,
  FileText,
  Link,
} from "lucide-react";

const PARAM_HELPERS: Record<string, string> = {
  starturls: "Enter a valid Facebook page URL, e.g. https://www.facebook.com/senatorWong/.",
  resultslimit: "If this limit is not set, only the initial page of results will be extracted.",
  rendertext: "Extract video transcript [ if available ]",
  onlynewerthan: "Scrape posts from the analyzed date to the present day YYYY-MM-DD format.",
  onlyolderthan: "Scrape posts from the analyzed date to the past YYYY-MM-DD format.",
};

const SUFFIX = "\n\nช่วยวิเคราะห์ให้หน่อยครับว่า โพสต์ไหนมีแนวโน้มที่คนสนใจจะซื้อสินค้ามากที่สุด? โดยแบ่งกลุ่มคนที่เข้ามาคอมเมนต์ออกเป็น 3 กลุ่มหลัก คือ: 1. กลุ่มที่สนใจซื้อสินค้า 2. กลุ่มที่ไม่สนใจ/ถามเฉยๆ 3. กลุ่มเชิงลบหรือต่อต้าน และช่วยเปรียบเทียบสัดส่วนของแต่ละโพสต์ให้เห็นภาพง่ายที่สุดครับ";

const URL_TEMPLATES = {
  numbered: `1. https://facebook.com/share/p/1/\n2. https://facebook.com/share/p/2/\n3. https://facebook.com/share/p/3/${SUFFIX}`,
  dashed: `- https://facebook.com/share/p/1/\n- https://facebook.com/share/p/2/\n- https://facebook.com/share/p/3/${SUFFIX}`,
  newline: `https://facebook.com/share/p/1/\nhttps://facebook.com/share/p/2/\nhttps://facebook.com/share/p/3/${SUFFIX}`,
  comma: `https://facebook.com/share/p/1/, https://facebook.com/share/p/2/, https://facebook.com/share/p/3/${SUFFIX}`,
};

function getHelperText(param: ToolParam): string {
  const key = param.key.toLowerCase();
  if (PARAM_HELPERS[key]) return PARAM_HELPERS[key];
  if (key.includes("url")) return "Enter a valid Facebook page URL. Note that you can only scrape public pages.";
  if (key.includes("limit") || key.includes("max")) return "If this limit is not set, only the initial page of results will be extracted.";
  if (key.includes("newer")) return "Scrape posts from the analyzed date to the present day (YYYY-MM-DD or relative).";
  if (key.includes("older")) return "Scrape posts from the analyzed date to the past (YYYY-MM-DD or relative).";
  if (key.includes("caption") || key.includes("render")) return "Extract video transcript [ if available ]";
  if (key.includes("comment")) return "Specify the count threshold of comments to pull and analyze per social post.";
  return param.placeholder && param.placeholder.length > 5 && !param.placeholder.includes("https://")
    ? param.placeholder
    : `Configure the parameter settings for ${param.label}.`;
}

interface FormParamFieldProps {
  param: ToolParam;
  value: unknown;
  error?: string;
  placeholderText?: string;
  onChange: (key: string, value: unknown) => void;
}

export function FormParamField({
  param,
  value,
  error,
  placeholderText,
  onChange,
}: FormParamFieldProps) {
  const helperText = getHelperText(param);
  const isPromptField = param.key === "prompt";

  return (
    <Field className="space-y-2.5">
      <div className="space-y-1">
        <FieldLabel
          htmlFor={param.key}
          className={cn(
            "font-semibold text-slate-700 cursor-pointer select-none",
            isPromptField ? "text-[15px]" : "text-sm"
          )}
        >
          {param.label}
          {param.required && <span className="text-red-500 ml-1">*</span>}
        </FieldLabel>
        {helperText && !error && (
          <span
            className={cn(
              "text-slate-400 font-semibold block leading-normal select-none transition-all duration-300",
              isPromptField ? "text-[11.5px]" : "text-[10.5px]"
            )}
          >
            {helperText}
          </span>
        )}
      </div>

      {param.type === "boolean" ? (
        <div className="flex items-center py-2 px-1">
          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <Switch
              id={param.key}
              checked={!!value}
              onCheckedChange={(val) => onChange(param.key, val)}
            />
            <span className="text-xs font-bold text-slate-650 group-hover:text-slate-900 transition-colors">
              Enabled
            </span>
          </label>
        </div>
      ) : param.type === "select" ? (
        <Select
          value={String(value || "")}
          onValueChange={(val) => onChange(param.key, val)}
        >
          <SelectTrigger
            id={param.key}
            className={cn(
              "h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all text-xs font-bold rounded-xl cursor-pointer shadow-xs hover:border-slate-300",
              error && "border-red-500 focus:ring-red-500/20 bg-red-50/30"
            )}
          >
            <SelectValue placeholder={param.placeholder || "Select an option..."} />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-lg border-slate-100">
            {param.options?.map((option, idx) => (
              <SelectItem
                key={`${option}-${idx}`}
                value={option}
                className="py-2.5 cursor-pointer rounded-lg text-xs font-semibold"
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : param.transform === "urlArray" ? (
        <UrlArrayInput
          id={param.key}
          value={(value as string[]) || []}
          onChange={(val) => onChange(param.key, val)}
          placeholder={param.placeholder}
          hasError={!!error}
        />
      ) : isPromptField ? (
        <div className="space-y-3.5">
          <div className="relative group/prompt flex flex-col">
            <Textarea
              id={param.key}
              placeholder={placeholderText || "กรอกความต้องการวิเคราะห์ข้อมูลที่นี่... (เช่น วิเคราะห์ทัศนคติ แยกแยะกลุ่มผู้ใช้ หรือ ค้นหาความเห็นเชิงบวก/เชิงลบ)"}
              value={String(value || "")}
              onChange={(e) => onChange(param.key, e.target.value)}
              className={cn(
                "min-h-58 pb-12 pt-4 bg-white border-slate-200/80 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all rounded-xl px-5 resize-vertical shadow-xs font-normal placeholder:text-slate-400 placeholder:opacity-85 text-slate-700 leading-relaxed text-sm whitespace-pre-wrap",
                error && "border-red-500 focus:ring-red-500/20 bg-red-50/30"
              )}
            />
            {/* Real-time details ribbon embedded at the bottom of the prompt card */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between border-t border-slate-100/80 pt-2.5 select-none pointer-events-none text-[10.5px] z-10 bg-white">
              {/* Query Complexity Badge */}
              <div className="flex items-center gap-1.5 font-bold">
                {(() => {
                  const len = String(value || "").length;
                  const pill = len === 0
                    ? { text: "Empty prompt", cls: "text-slate-400", dot: "bg-slate-350" }
                    : len < 150
                      ? { text: "Simple Scope", cls: "text-slate-500 bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded-lg", dot: "bg-slate-400" }
                      : len < 500
                        ? { text: "Balanced Query", cls: "text-blue-600 bg-blue-50/50 border border-blue-100/50 px-2 py-0.5 rounded-lg", dot: "bg-blue-500" }
                        : { text: "Deep AI Analysis", cls: "text-indigo-650 bg-indigo-50/50 border border-indigo-100/50 px-2 py-0.5 rounded-lg animate-pulse", dot: "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" };
                  return (
                    <span className={cn("flex items-center gap-1.5 font-bold", pill.cls)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", pill.dot)}></span>
                      {pill.text}
                    </span>
                  );
                })()}
              </div>

              {/* Character Limit */}
              <div className="font-bold text-slate-400">
                <span className="text-slate-650 font-extrabold">{String(value || "").length}</span> / 2,000 chars
              </div>
            </div>
          </div>
          <div className="bg-linear-to-b from-slate-50/50 via-white to-slate-50/30 rounded-2xl border border-slate-200/60 p-4 space-y-3.5 transition-all duration-300 shadow-2xs hover:shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2 select-none">
              <div className="flex items-center gap-2 text-[10.5px] font-extrabold text-slate-500">
                <Link className="h-3.5 w-3.5 text-brand" />
                <span>รูปแบบ URL ที่รองรับ (คลิกเพื่อเติมตัวอย่างด่วน)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-slate-400 bg-white border border-slate-200/40 px-2 py-0.5 rounded-full shadow-2xs">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Auto-fill Template</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange(param.key, URL_TEMPLATES.numbered)}
                className="group relative flex items-center gap-2 h-8.5 px-3 bg-white hover:bg-slate-50 border border-slate-200/60 hover:border-slate-350 text-slate-600 hover:text-slate-900 rounded-xl font-bold transition-all duration-200 cursor-pointer text-[10px] shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:scale-95"
              >
                <ListOrdered className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand transition-colors" />
                <span>ลำดับ (1. https://...)</span>
              </button>
              <button
                type="button"
                onClick={() => onChange(param.key, URL_TEMPLATES.dashed)}
                className="group relative flex items-center gap-2 h-8.5 px-3 bg-white hover:bg-slate-50 border border-slate-200/60 hover:border-slate-350 text-slate-600 hover:text-slate-900 rounded-xl font-bold transition-all duration-200 cursor-pointer text-[10px] shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:scale-95"
              >
                <List className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand transition-colors" />
                <span>ขีดละรายการ (- https://...)</span>
              </button>
              <button
                type="button"
                onClick={() => onChange(param.key, URL_TEMPLATES.newline)}
                className="group relative flex items-center gap-2 h-8.5 px-3 bg-white hover:bg-slate-50 border border-slate-200/60 hover:border-slate-350 text-slate-600 hover:text-slate-900 rounded-xl font-bold transition-all duration-200 cursor-pointer text-[10px] shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:scale-95"
              >
                <CornerDownLeft className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand transition-colors" />
                <span>แยกบรรทัด (https://...)</span>
              </button>
              <button
                type="button"
                onClick={() => onChange(param.key, URL_TEMPLATES.comma)}
                className="group relative flex items-center gap-2 h-8.5 px-3 bg-white hover:bg-slate-50 border border-slate-200/60 hover:border-slate-350 text-slate-600 hover:text-slate-900 rounded-xl font-bold transition-all duration-200 cursor-pointer text-[10px] shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:scale-95"
              >
                <FileText className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand transition-colors" />
                <span>คั่นด้วยจุลภาค (https://..., ...)</span>
              </button>
            </div>
          </div>
        </div>
      ) : param.key === "rawInput" ||
        param.key === "text" ||
        (param as ToolParam & { multiline?: boolean }).multiline ? (
        <Textarea
          id={param.key}
          placeholder={param.placeholder || `Enter ${param.label.toLowerCase()}...`}
          value={String(value || "")}
          onChange={(e) => onChange(param.key, e.target.value)}
          className={cn(
            "min-h-30 py-3 bg-slate-50 border-slate-200/60 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all text-xs font-semibold rounded-xl px-4 resize-none shadow-2xs hover:border-slate-300",
            error && "border-red-500 focus:ring-red-500/20 bg-red-50/30"
          )}
        />
      ) : (
        <Input
          id={param.key}
          placeholder={param.placeholder || `Enter ${param.label.toLowerCase()}...`}
          value={String(value || "")}
          onChange={(e) => onChange(param.key, e.target.value)}
          className={cn(
            "h-11 bg-slate-50 border-slate-200/60 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all text-xs font-semibold rounded-xl px-4 shadow-2xs hover:border-slate-300",
            error && "border-red-500 focus:ring-red-500/20 bg-red-50/30"
          )}
        />
      )}
      <FieldError
        errors={error ? [{ message: error }] : []}
        className="text-[11px] -mt-2 font-normal text-red-500 flex items-center gap-1"
      />
    </Field>
  );
}
