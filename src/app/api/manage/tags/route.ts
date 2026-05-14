import { NextResponse } from "next/server";

import { getManageTagsResponse } from "@/core/services/tags.service";
import { ApiError } from "@/core/services/api";

export async function GET() {
    try {
        const response = await getManageTagsResponse({ cache: "no-store" });
        return NextResponse.json(response);
    } catch (error) {
        if (error instanceof ApiError) {
            return NextResponse.json(
                {
                    success: false,
                    message: error.message,
                    data: [],
                },
                { status: error.status },
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch tags",
                data: [],
            },
            { status: 500 },
        );
    }
}
