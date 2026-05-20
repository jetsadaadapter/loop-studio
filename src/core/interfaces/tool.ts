
export interface ToolParam {
    id: string;
    toolId: string;
    key: string;
    label: string;
    type: string;
    defaultValue: string | null;
    transform: string | null;
    placeholder: string | null;
    options: Array<string | number | boolean | { label: string; value: string }> | null;
    required: boolean;
    sortOrder: number;
    config: Record<string, unknown> | null;
}


export interface ToolScript {
    id: string;
    toolId: string;
    plugin: string;
    config: Record<string, unknown>;
    label: string;
    description: string | null;
    sortOrder: number;
}


export interface ManageToolApiItem {
    id: string;
    name: string;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
    userId: string;
    params: ToolParam[];
    scripts: ToolScript[];
    createdAt: string;
    updatedAt: string;
}

export interface ManageToolListResponse {
    success: boolean;
    message: string;
    data: ManageToolApiItem[];
}
