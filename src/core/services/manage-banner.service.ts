// Service for manage banners
import { BannerManageItem } from "../interfaces/manage-banner.interface";

export async function getManageBanners() {
    const res = await fetch("/api/manage/banners");
    if (!res.ok) throw new Error("Failed to fetch banners");
    const json = await res.json();
    return json.data as BannerManageItem[];
}

export async function deleteBanner(id: string) {
    const res = await fetch(`/api/manage/banners/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete banner");
    return true;
}
