import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { FolderActionSchema } from "@/core/validators/loop-projects.validator";

// Lists sub-directories of an absolute path so the Register/Bootstrap modals can
// browse the server's local filesystem instead of hand-typing a path. Guarded by
// the app auth proxy + the Loop Studio (super-admin) route guard.
export async function GET(req: Request) {
    try {
        const requested = new URL(req.url).searchParams.get("path")?.trim();
        const current = requested && requested.length > 0 ? requested : os.homedir();

        if (!path.isAbsolute(current)) {
            return NextResponse.json({ success: false, error: "Path must be absolute." }, { status: 400 });
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

        const parent = path.dirname(current);
        return NextResponse.json({
            success: true,
            data: { current, parent: parent === current ? null : parent, dirs },
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
