import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // This endpoint receives CSP violation reports from browsers.
  // For now, just log the report. In production you might forward it to a
  // centralized logging service or database for analysis.
  const body = await request.json();
  console.warn("[CSP Violation Report]", JSON.stringify(body));

  // Respond with 204 No Content to indicate successful receipt.
  return new NextResponse(null, { status: 204 });
}