import { NextResponse } from "next/server";
import { getManageCategoriesResponse } from "@/core/services/categories.service";
import { ApiError } from "@/core/services/api";

export async function GET() {
    try {
        const response = await getManageCategoriesResponse({ cache: "no-store" });
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
                message: "Failed to fetch categories",
                data: [],
            },
            { status: 500 },
        );
    }
}
