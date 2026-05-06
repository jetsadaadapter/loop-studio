import { Button } from "@/components/ui/button";

type ManagerDeleteConfirmProps = {
  itemName: string;
  itemId: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  itemTypeLabel?: string;
};

export function ManagerDeleteConfirm({
  itemName,
  itemId,
  onCancel,
  onConfirm,
  isLoading = false,
  itemTypeLabel = "app",
}: ManagerDeleteConfirmProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-medium text-red-900">Delete {itemTypeLabel}</p>
      <p className="mt-1 text-sm text-red-800">
        You are deleting <strong>{itemName}</strong> ({itemId}). This action
        cannot be undone.
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? "Deleting..." : "Confirm Delete"}
        </Button>
      </div>
    </div>
  );
}
