import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("zt_token");

  let host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (host && host.includes(",")) {
    host = host.split(",")[0].trim();
  }

  let proto = request.headers.get("x-forwarded-proto") || "https";
  if (proto && proto.includes(",")) {
    proto = proto.split(",")[0].trim();
  }

  if (host) {
    return NextResponse.redirect(new URL("/login", `${proto}://${host}`));
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
