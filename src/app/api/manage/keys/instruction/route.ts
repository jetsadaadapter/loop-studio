import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "src/app/manage/keys/instruction/README.md"
    );
    const content = await fs.readFile(filePath, "utf-8");
    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("Failed to read README.md:", error);
    return NextResponse.json(
      { success: false, error: "Failed to read instruction markdown" },
      { status: 500 }
    );
  }
}
