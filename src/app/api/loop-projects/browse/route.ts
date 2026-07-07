import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

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
