import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { FolderActionSchema } from "@/core/validators/loop-projects.validator";

// Lists sub-directories of an absolute path so the Register/Bootstrap modals can
// browse the server's local filesystem instead of hand-typing a path.
//
// This is NOT auth-gated — Loop Studio has no auth (§3). Its protection is the
// same as the rest of the API: bound to localhost, with src/proxy.ts enforcing a
// Host allowlist (defeats DNS rebinding) and a same-origin check on the POST
// mutations below. The GET listing is intentional (the folder picker) and exposes
// no more of the filesystem than the local user's own shell already can.
//
// LOOP_BROWSE_ROOT (optional) confines the picker to one subtree — set it when
// running on a shared machine to stop the picker from wandering outside a
// workspace dir. Unset = browse anywhere under the user's account (the default).

/** Resolved LOOP_BROWSE_ROOT, or null when unset (no confinement). */
export function browseRootFromEnv(): string | null {
    const raw = process.env.LOOP_BROWSE_ROOT?.trim();
    return raw ? path.resolve(raw) : null;
}

/** Reject null bytes and (when a root is configured) any path outside it.
 *  Throws Error — callers turn it into a 400/403. Pure, so it's unit-testable. */
export function assertBrowsePathAllowed(target: string, root: string | null): void {
    if (target.includes("\0")) throw new Error("Invalid path.");
    if (!root) return;
    const resolved = path.resolve(target);
    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
        throw new Error("Path is outside the allowed browse root (LOOP_BROWSE_ROOT).");
    }
}

export async function GET(req: Request) {
    try {
        const root = browseRootFromEnv();
        const requested = new URL(req.url).searchParams.get("path")?.trim();
        // Default start: the configured root, else the user's home dir.
        const current = requested && requested.length > 0 ? requested : (root ?? os.homedir());

        if (!path.isAbsolute(current)) {
            return NextResponse.json({ success: false, error: "Path must be absolute." }, { status: 400 });
        }
        try {
            assertBrowsePathAllowed(current, root);
        } catch (e) {
            return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Path not allowed." }, { status: 403 });
        }
        if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) {
            return NextResponse.json({ success: false, error: "Directory does not exist." }, { status: 400 });
        }

        const dirs = fs
            .readdirSync(current, { withFileTypes: true })
            .filter((entry) => {
                try {
                    return entry.isDirectory();
                } catch {
                    return false;
                }
            })
            .map((entry) => ({ name: entry.name, path: path.join(current, entry.name) }))
            .sort((a, b) => a.name.localeCompare(b.name));

        // No "up" link past the filesystem root or the configured browse root.
        const parentDir = path.dirname(current);
        const atRoot = parentDir === current || (root !== null && current === root);
        return NextResponse.json({
            success: true,
            data: { current, parent: atRoot ? null : parentDir, dirs },
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

// Folder management for the picker: create, rename, and delete directories.
// Delete only removes EMPTY directories — the picker is for organizing new
// workspace folders, never for destroying existing work.
export async function POST(req: Request) {
    try {
        const parsed = FolderActionSchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
        }
        const input = parsed.data;

        // Every mutation operates on input.path (and, for mkdir/rename, a child of
        // it), so confining input.path to the browse root confines the whole op.
        const root = browseRootFromEnv();
        try {
            assertBrowsePathAllowed(input.path, root);
        } catch (e) {
            return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Path not allowed." }, { status: 403 });
        }

        if (input.action === "mkdir") {
            const target = path.join(input.path, input.name);
            if (!fs.existsSync(input.path) || !fs.statSync(input.path).isDirectory()) {
                return NextResponse.json({ success: false, error: "Parent directory does not exist." }, { status: 400 });
            }
            if (fs.existsSync(target)) {
                return NextResponse.json({ success: false, error: "A file or folder with that name already exists." }, { status: 400 });
            }
            fs.mkdirSync(target);
            return NextResponse.json({ success: true, data: { path: target } });
        }

        // rename/delete operate on an existing directory — never the home dir or filesystem root.
        if (!fs.existsSync(input.path) || !fs.statSync(input.path).isDirectory()) {
            return NextResponse.json({ success: false, error: "Directory does not exist." }, { status: 400 });
        }
        if (input.path === os.homedir() || path.dirname(input.path) === input.path) {
            return NextResponse.json({ success: false, error: "This directory cannot be modified." }, { status: 400 });
        }

        if (input.action === "rename") {
            const target = path.join(path.dirname(input.path), input.newName);
            if (fs.existsSync(target)) {
                return NextResponse.json({ success: false, error: "A file or folder with that name already exists." }, { status: 400 });
            }
            fs.renameSync(input.path, target);
            return NextResponse.json({ success: true, data: { path: target } });
        }

        // delete
        if (fs.readdirSync(input.path).length > 0) {
            return NextResponse.json({ success: false, error: "Only empty folders can be deleted here." }, { status: 400 });
        }
        fs.rmdirSync(input.path);
        return NextResponse.json({ success: true, data: { path: input.path } });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
