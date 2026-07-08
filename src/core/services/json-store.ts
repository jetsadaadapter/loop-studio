import fs from "fs";
import path from "path";

/**
 * Shared helpers for the JSON-file stores under `.antigravity/`.
 *
 * Failure-mode guarantees (the whole point of this module):
 * - A corrupt store file is backed up to `<file>.corrupt-<timestamp>` before
 *   the default value is returned, so the next save can never overwrite the
 *   only remaining copy of real data.
 * - Read errors other than a bad parse (permissions, transient fs failures)
 *   throw instead of returning the default — returning the default there
 *   would let a follow-up save wipe the store.
 * - Writes go to a temp file first and are renamed into place, which is
 *   atomic on POSIX: a crash mid-write leaves the previous version intact.
 * - Write failures throw; callers must not treat a failed save as success.
 *
 * Node runs JS single-threaded, so a synchronous read → mutate → write cycle
 * is safe from lost updates as long as it does not span an `await`. Re-read
 * the store after any await before mutating it.
 */

/** Guard an id that will become part of a store filename (path-traversal safety). */
export function assertSafeStoreId(id: string): string {
    if (!/^[A-Za-z0-9_-]+$/.test(id)) {
        throw new Error(`Invalid store id: ${id}`);
    }
    return id;
}

export function readJsonStore<T>(filePath: string, defaultValue: T): T {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (!fs.existsSync(filePath)) {
        writeJsonStore(filePath, defaultValue);
        return defaultValue;
    }
    const data = fs.readFileSync(filePath, "utf8");
    try {
        return JSON.parse(data) as T;
    } catch (err) {
        const backupPath = `${filePath}.corrupt-${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        console.error(
            `[json-store] ${filePath} is corrupt; backed it up to ${backupPath} and falling back to the default value.`,
            err
        );
        return defaultValue;
    }
}

export function writeJsonStore<T>(filePath: string, data: T): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmpPath = `${filePath}.tmp-${process.pid}`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tmpPath, filePath);
}

export function deleteJsonStore(filePath: string): void {
    fs.rmSync(filePath, { force: true });
}
