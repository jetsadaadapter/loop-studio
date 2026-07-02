import type { ProjectItem } from "@/core/interfaces/projects.interface";

export interface ProjectActivity {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    action: string;
    targetName: string;
    projectName: string;
    priority?: "low" | "medium" | "high" | "urgent" | "in progress";
    createdAt: string;
}

export const MOCK_PROJECTS: ProjectItem[] = [
    {
        id: "01KVZH7XJ57RNZJ5KHTP0100FN",
        name: "Product Redesign",
        credits: 1450,
        userId: "6E88D7AA-54F2-4CE7-99FA-AB6D97920E0B",
        createdAt: "2026-06-24T10:00:00.000Z",
        updatedAt: "2026-06-25T14:52:42.089Z",
        connectedAppIds: ["app_01ktp0p9f679nf2pm2z57sgsd1"],
        connectedToolIds: ["tool_01ktp0p9f679nf2pm2z57sgsd2"],
        connectedApiKeyIds: ["29634c13-d8fc-4604-b9fd-bb14dcdca468"]
    },
    {
        id: "01KVZH49ASXZ1QFYGBRX4146QH",
        name: "Mobile App Beta",
        credits: 890,
        userId: "6E88D7AA-54F2-4CE7-99FA-AB6D97920E0B",
        createdAt: "2026-06-25T08:30:00.000Z",
        updatedAt: "2026-06-26T04:22:15.000Z",
        connectedAppIds: [],
        connectedToolIds: ["tool_01ktp0p9f679nf2pm2z57sgsd2"],
        connectedApiKeyIds: []
    },
    {
        id: "01KVZH89KSXZ1QFYGBRX5158AB",
        name: "Marketing Site",
        credits: 320,
        userId: "6E88D7AA-54F2-4CE7-99FA-AB6D97920E0B",
        createdAt: "2026-06-23T14:20:00.000Z",
        updatedAt: "2026-06-26T09:12:00.000Z",
        connectedAppIds: [],
        connectedToolIds: [],
        connectedApiKeyIds: ["782cd4a1-b12a-4a29-87a2-bb8f4c12d46a"]
    }
];
