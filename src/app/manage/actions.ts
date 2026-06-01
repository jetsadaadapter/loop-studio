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
