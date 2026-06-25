import type { ManageApiEnvelope } from "./common.interface";

export type ManageMenuItem = {
    name: string;
    path: string;
    icon: string;
    type: "main" | "manage" | "developer" | string;
};

export type ManageMenuResponse = ManageApiEnvelope<ManageMenuItem[]>;
