import { Button } from "../ui/button";
// import { Badge } from "../ui/badge"; // Badge is not used
import React from "react";
import { Brain } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export interface ManagerModelTableProps {
  models: Array<{
    id: string;
    modelSlug: string;
    name: string;
    provider: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  isLoading: boolean;
  isSubmitting: boolean;
  settingDefaultId: string | null;
  deletingId: string | null;
  loadError?: boolean;
  hasActiveFilter: boolean;
  onEdit: (modelId: string) => void;
  onSetDefault: (modelId: string) => void;
  onDelete: (modelId: string) => void;
  onRetry: () => void;
  onAdd: () => void;
  onClearFilters: () => void;
  hideCheckboxAll?: boolean;
}

export function ManagerModelTable({
  models,
  isLoading,
  isSubmitting,
  settingDefaultId,
  deletingId,
  loadError,
  hasActiveFilter,
  onEdit,
  onSetDefault,
  onDelete,
  onRetry,
  onAdd,
  onClearFilters,
  hideCheckboxAll,
}: ManagerModelTableProps) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className="w-full caption-bottom text-sm min-w-2xl"
      >
        <thead data-slot="table-header" className="[&_tr]:border-b">
          <tr
            data-slot="table-row"
            className="data-[state=selected]:bg-muted border-b transition-colors hover:bg-transparent!"
          >
            {!hideCheckboxAll && (
              <th
                data-slot="table-head"
                className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap [&:has([role=checkbox])]:pr-0 p-3 ps-6"
              >
                {/* Checkbox column header */}
              </th>
            )}
            <th
              data-slot="table-head"
              className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap [&:has([role=checkbox])]:pr-0 p-2 px-3"
            >
              #
            </th>
            <th
              data-slot="table-head"
              className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap [&:has([role=checkbox])]:pr-0 p-2"
            >
              Model Name
            </th>
            <th
              data-slot="table-head"
              className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap [&:has([role=checkbox])]:pr-0 p-2"
            >
              Provider
            </th>
            <th
              data-slot="table-head"
              className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap [&:has([role=checkbox])]:pr-0 p-2"
            >
              Created
            </th>
            <th
              data-slot="table-head"
              className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap [&:has([role=checkbox])]:pr-0 p-2"
            >
              Status
            </th>
            <th
              data-slot="table-head"
              className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap [&:has([role=checkbox])]:pr-0 p-3 pe-6 flex justify-start"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody
          data-slot="table-body"
          className="[&_tr:last-child]:border-0 divide-y divide-border dark:divide-darkborder"
        >
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b transition-colors hover:bg-transparent!">
                {!hideCheckboxAll && (
                  <td className="p-3 ps-6">
                    <Skeleton className="h-4 w-4 rounded" />
                  </td>
                )}
                <td className="p-2 px-3">
                  <Skeleton className="h-4 w-8" />
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </td>
                <td className="p-2">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="p-2">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </td>
                <td className="p-3 pe-6">
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16 rounded-sm" />
                    <Skeleton className="h-8 w-24 rounded-sm" />
                    <Skeleton className="h-8 w-20 rounded-sm" />
                  </div>
                </td>
              </tr>
            ))
          ) : models.length === 0 ? (
            <tr>
              <td
                colSpan={hideCheckboxAll ? 6 : 7}
                className="p-4 text-center text-muted-foreground"
              >
                {loadError
                  ? "Unable to load AI models right now."
                  : "No AI models configured yet. Add one to begin testing and assignment."}
                <div className="flex gap-2 justify-center mt-2">
                  {loadError ? (
                    <Button type="button" size="sm" onClick={onRetry}>
                      Retry
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        isSubmitting ||
                        settingDefaultId !== null ||
                        deletingId !== null
                      }
                      onClick={onAdd}
                    >
                      Add Model
                    </Button>
                  )}
                  {hasActiveFilter && !loadError && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={onClearFilters}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            models.map((row, index) => (
              <tr
                key={row.id}
                data-slot="table-row"
                className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
              >
                {!hideCheckboxAll && (
                  <td
                    data-slot="table-cell"
                    className="align-middle [&:has([role=checkbox])]:pr-0 whitespace-nowrap p-3 ps-6"
                  >
                    <span
                      data-unchecked=""
                      role="checkbox"
                      tabIndex={0}
                      aria-checked="false"
                      data-slot="checkbox"
                      aria-label="Select model"
                      className="border-input dark:bg-input/30 data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary data-checked:border-primary aria-invalid:aria-checked:border-primary aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 flex size-4 items-center justify-center rounded-lg border transition-colors group-has-disabled/field:opacity-50 focus-visible:ring-3 aria-invalid:ring-3 peer relative shrink-0 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    ></span>
                    <input
                      tabIndex={-1}
                      type="checkbox"
                      aria-hidden="true"
                      className="sr-only"
                      aria-label="Select model"
                    />
                  </td>
                )}
                <td
                  data-slot="table-cell"
                  className="p-2 px-3 align-middle whitespace-nowrap text-xs font-medium text-muted-foreground"
                >
                  #{index + 1}
                </td>
                <td
                  data-slot="table-cell"
                  className="p-2 align-middle [&:has([role=checkbox])]:pr-0 whitespace-nowrap min-w-62.5"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center bg-indigo-400/20">
                      <Brain
                        className="size-4.5 text-indigo-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="">
                      <h6 className="text-sm font-medium">{row.name}</h6>
                      <p className="text-xs text-muted-foreground">
                        {row.modelSlug}
                      </p>
                    </div>
                  </div>
                </td>
                <td
                  data-slot="table-cell"
                  className="p-2 align-middle [&:has([role=checkbox])]:pr-0 whitespace-nowrap"
                >
                  <span className="text-sm font-normal text-muted-foreground">
                    {row.provider}
                  </span>
                </td>
                <td
                  data-slot="table-cell"
                  className="p-2 align-middle [&:has([role=checkbox])]:pr-0 whitespace-nowrap"
                >
                  <p className="text-sm font-normal text-muted-foreground">
                    {row.createdAt}
                  </p>
                </td>
                <td
                  data-slot="table-cell"
                  className="p-2 align-middle [&:has([role=checkbox])]:pr-0 whitespace-nowrap"
                >
                  <div className="flex gap-2 text-sm items-center font-normal text-muted-foreground">
                    <span
                      className={
                        `inline-block h-2 w-2 rounded-full mr-0 align-middle ` +
                        (row.isActive ? "bg-green-500" : "bg-gray-400")
                      }
                      aria-label={row.isActive ? "Active" : "Inactive"}
                    ></span>
                    <span
                      className={
                        row.isActive ? "text-green-700" : "text-gray-500"
                      }
                    >
                      {row.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </td>
                <td
                  data-slot="table-cell"
                  className="align-middle [&:has([role=checkbox])]:pr-0 whitespace-nowrap p-3 pe-6"
                >
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        isSubmitting ||
                        settingDefaultId !== null ||
                        deletingId !== null
                      }
                      onClick={() => onEdit(row.id)}
                    >
                      Edit
                    </Button>
                    {row.isDefault ? null : (
                      <Button
                        type="button"
                        size="sm"
                        disabled={
                          isSubmitting ||
                          settingDefaultId !== null ||
                          deletingId !== null
                        }
                        onClick={() => onSetDefault(row.id)}
                      >
                        {settingDefaultId === row.id ? (
                          <span className="inline-flex items-center gap-1.5">
                            Setting...
                          </span>
                        ) : (
                          "Set Default"
                        )}
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={
                        isSubmitting ||
                        settingDefaultId !== null ||
                        deletingId !== null
                      }
                      onClick={() => onDelete(row.id)}
                    >
                      {deletingId === row.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
