"use server";

import fs from "fs";
import path from "path";

/**
 * Checks if a manage route is implemented in the frontend src/app directory.
 * Standardizes "/manage/dashboard" to "/manage" to match the actual folder structure.
 */
export async function checkRouteImplemented(routePath: string): Promise<boolean> {
  try {
    let normalizedPath = routePath.trim();
    if (normalizedPath === "/manage/dashboard") {
      normalizedPath = "/manage";
    }

    if (normalizedPath === "/manage" || normalizedPath === "/") {
      return true;
    }

    const relativePath = normalizedPath.replace(/^\//, "");

    // In production, Next.js build output (.next) is used since src/app is typically not deployed
    if (process.env.NODE_ENV === "production") {
      const distDir = ".next";
      const nextAppPath = path.join(process.cwd(), distDir, "server/app", relativePath);

      // Check if compiled files or directory exist inside .next server/app
      const existsInNext =
        fs.existsSync(nextAppPath) ||
        fs.existsSync(`${nextAppPath}.html`) ||
        fs.existsSync(`${nextAppPath}.rsc`) ||
        fs.existsSync(path.join(nextAppPath, "page.js")) ||
        fs.existsSync(path.join(nextAppPath, "page/page.js"));

      if (existsInNext) {
        return true;
      }

      // Fallback: If running in production but the .next directory is not located in process.cwd()
      // (e.g. in some custom Docker or serverless setup), default to true to prevent hiding valid routes.
      return true;
    }

    // Development fallback using source files
    const fullPath = path.join(process.cwd(), "src/app", relativePath);
    const dirExists = fs.existsSync(fullPath);
    if (!dirExists) {
      return false;
    }

    const pageExists =
      fs.existsSync(path.join(fullPath, "page.tsx")) ||
      fs.existsSync(path.join(fullPath, "page.ts"));

    return pageExists;
  } catch (error) {
    console.error(`Error checking route implementation for ${routePath}:`, error);
    return false;
  }
}
