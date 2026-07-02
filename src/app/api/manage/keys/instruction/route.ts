import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    // Read from public directory which is accessible at runtime
    const filePath = path.join(
      process.cwd(),
      "public/docs/integration-guide.md"
    );
    console.log("[instruction API] Reading file from:", filePath);
    const content = await fs.readFile(filePath, "utf-8");
    console.log("[instruction API] Successfully read file, length:", content.length);
    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("[instruction API] Failed to read integration-guide.md:", error);
    console.error("[instruction API] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { success: false, error: "Failed to read instruction markdown" },
      { status: 500 }
    );
  }
}
