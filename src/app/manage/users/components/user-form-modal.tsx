"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X, User, Copy, Check } from "lucide-react";
import { ManageUserSchema } from "@/core/validators/users.validator";
import type { ManageUserFormValues } from "@/core/validators/users.validator";
import { Role } from "@/core/interfaces/auth.interface";
import type { UserProfile } from "@/core/interfaces/auth.interface";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";

interface UserFormModalProps {
  user: UserProfile;
  isSubmitting: boolean;
  submitError: string;
  onSubmit: (values: ManageUserFormValues) => void;
  onClose: () => void;
}

const AVAILABLE_ROLES = [Role.SystemAdmin, Role.Admin, Role.Developer, Role.User];

function truncateEmpId(empid: string) {
  if (empid.length <= 12) return empid;
  return `${empid.slice(0, 8)}…${empid.slice(-4)}`;
}

export function UserFormModal({
  user,
  isSubmitting,
  submitError,
  onSubmit,
  onClose,
}: UserFormModalProps) {
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [department] = useState(user.department ?? "");
  const [position] = useState(user.position ?? "");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles ?? []);
  const [errors, setErrors] = useState<Partial<Record<keyof ManageUserFormValues, string>>>({});
  const [copiedEmpId, setCopiedEmpId] = useState(false);
  const focusInputRef = useRef<HTMLInputElement>(null);

  function handleCopyEmpId() {
    void navigator.clipboard.writeText(user.empid);
    setCopiedEmpId(true);
    setTimeout(() => setCopiedEmpId(false), 2000);
  }

  useEffect(() => {
    focusInputRef.current?.focus();
  }, []);

  function handleRoleToggle(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function validate(): ManageUserFormValues | null {
    const result = ManageUserSchema.safeParse({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      department: department.trim(),
      position: position.trim(),
      roles: selectedRoles,
    });

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ManageUserFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ManageUserFormValues;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return null;
    }
    setErrors({});
    return result.data;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const values = validate();
    if (!values) return;
    onSubmit(values);
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent hideCloseButton className="w-full max-w-lg rounded-2xl border border-slate-200/60 bg-white p-0 shadow-xl shadow-slate-900/10 overflow-hidden focus:outline-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-3xs">
              <User className="size-3.5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-800 leading-tight">
                Edit User Console Access
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-slate-400 font-sans">
                  {truncateEmpId(user.empid)} • {user.email}
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmpId}
                  title="Copy full Emp ID"
                  className="flex items-center justify-center size-4 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {copiedEmpId
                    ? <Check className="size-2.5 text-emerald-500" />
                    : <Copy className="size-2.5" />}
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Name fields (Row) */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="first-name">
                First Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                ref={focusInputRef}
                id="first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Jetsada"
                className="h-8 text-xs placeholder:text-xs"
              />
              <FieldError errors={errors.firstName ? [{ message: errors.firstName }] : []} />
            </Field>

            <Field>
              <FieldLabel htmlFor="last-name">
                Last Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Saokaew"
                className="h-8 text-xs placeholder:text-xs"
              />
              <FieldError errors={errors.lastName ? [{ message: errors.lastName }] : []} />
            </Field>
          </div>

          {/* Department & Position (Row) */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="user-dept">Department</FieldLabel>
              <Input
                id="user-dept"
                type="text"
                value={department}
                readOnly
                className="h-8 text-xs cursor-default bg-slate-50 text-slate-500 select-none"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="user-pos">Position</FieldLabel>
              <Input
                id="user-pos"
                type="text"
                value={position}
                readOnly
                className="h-8 text-xs cursor-default bg-slate-50 text-slate-500 select-none"
              />
            </Field>
          </div>

          {/* Security Roles Checkboxes */}
          <Field>
            <FieldLabel>
              Security Roles <span className="text-destructive">*</span>
            </FieldLabel>
            <div className="grid grid-cols-2 gap-3 mt-1.5 border border-slate-100 rounded-lg p-3 bg-slate-50/30">
              {AVAILABLE_ROLES.map((role) => {
                const checked = selectedRoles.includes(role);
                return (
                  <div
                    key={role}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200/60 bg-white shadow-3xs hover:bg-slate-50 transition-colors select-none animate-in fade-in duration-200"
                  >
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-600">
                      {role}
                    </span>
                    <Switch
                      checked={checked}
                      onCheckedChange={() => handleRoleToggle(role)}
                    />
                  </div>
                );
              })}
            </div>
            <FieldDescription>
              Assign system roles to specify authorization boundaries for the developer console.
            </FieldDescription>
            <FieldError errors={errors.roles ? [{ message: errors.roles }] : []} />
          </Field>

          {/* Error display */}
          {submitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-100 font-medium">
              {submitError}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 cursor-pointer rounded-sm border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-sm bg-brand px-5 text-xs font-semibold text-white shadow-sm shadow-brand/10 transition-all hover:bg-brand/90 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
