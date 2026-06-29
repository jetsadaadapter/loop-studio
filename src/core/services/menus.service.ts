import type {
    ManageMenuItem,
    ManageMenuResponse,
} from "@/core/interfaces/menus.interface";
import { apiFetch, buildUrl } from "@/core/services/api";

export async function getManageMenus(init?: RequestInit): Promise<ManageMenuItem[]> {
    const url = buildUrl("/access/menus", { _t: Date.now() });
    const response = await apiFetch<ManageMenuResponse>(url, {
        ...init,
        cache: "no-store",
    });
    return response.data;
}
