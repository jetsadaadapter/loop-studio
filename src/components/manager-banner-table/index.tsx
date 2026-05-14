import * as React from "react";
import { BannerManageItem } from "../../core/interfaces/manage-banner.interface";
import { ManagerBannerDeleteConfirm } from "./manager-banner-delete-confirm";
import { Button } from "../ui/button";

interface ManagerBannerTableProps {
  banners: BannerManageItem[];
  onDelete: (id: string) => void;
  loadingId: string | null;
}

export function ManagerBannerTable({
  banners,
  onDelete,
  loadingId,
}: ManagerBannerTableProps) {
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = React.useState<string>("");

  const handleOpenDelete = (id: string, title: string) => {
    setDeleteId(id);
    setDeleteTitle(title);
  };
  const handleCloseDelete = () => {
    setDeleteId(null);
    setDeleteTitle("");
  };
  const handleConfirmDelete = () => {
    if (deleteId) onDelete(deleteId);
    handleCloseDelete();
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="p-2">ชื่อ Banner</th>
            <th className="p-2">App</th>
            <th className="p-2">Category</th>
            <th className="p-2">สถานะ</th>
            <th className="p-2">ลำดับ</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {banners.map((banner) => (
            <tr key={banner.id} className="border-b">
              <td className="p-2">{banner.title}</td>
              <td className="p-2">{banner.app?.name}</td>
              <td className="p-2">
                {typeof banner.app?.category === "string"
                  ? banner.app.category
                  : banner.app?.category?.name || ""}
              </td>
              <td className="p-2">{banner.isActive ? "Active" : "Inactive"}</td>
              <td className="p-2">{banner.sortOrder}</td>
              <td className="p-2">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={loadingId === banner.id}
                  onClick={() => handleOpenDelete(banner.id, banner.title)}
                >
                  {loadingId === banner.id ? "กำลังลบ..." : "ลบ"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ManagerBannerDeleteConfirm
        open={!!deleteId}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        bannerTitle={deleteTitle}
      />
    </div>
  );
}
