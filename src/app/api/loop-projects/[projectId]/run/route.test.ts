import { describe, it, expect } from "vitest";
import { devLaunchArgs } from "./route";

const BASE = ["run", "dev"];

describe("devLaunchArgs", () => {
    it("passes --port on the CLI for Vite (which ignores the PORT env var)", () => {
        const r = devLaunchArgs("vite-react", BASE, "http://localhost:3002");
        expect(r.args).toEqual(["run", "dev", "--", "--port", "3002"]);
        expect(r.extraEnv).toEqual({ PORT: "3002" });
    });

    it("passes --port for Next templates too", () => {
        expect(devLaunchArgs("nextjs-app", BASE, "http://localhost:3005").args)
            .toEqual(["run", "dev", "--", "--port", "3005"]);
        expect(devLaunchArgs("nextjs-pages", BASE, "http://localhost:3006").args)
            .toEqual(["run", "dev", "--", "--port", "3006"]);
    });

    it("uses only the PORT env for non-flag templates (nodejs/generic)", () => {
        const r = devLaunchArgs("nodejs", BASE, "http://localhost:3001");
        expect(r.args).toEqual(BASE); // unchanged — no --port appended
        expect(r.extraEnv).toEqual({ PORT: "3001" });
    });

    it("leaves args and env untouched when the previewUrl has no explicit port", () => {
        const r = devLaunchArgs("vite-react", BASE, "/");
        expect(r.args).toEqual(BASE);
        expect(r.extraEnv).toBeUndefined();
    });

    it("handles a missing previewUrl", () => {
        const r = devLaunchArgs("vite-react", BASE, undefined);
        expect(r.args).toEqual(BASE);
        expect(r.extraEnv).toBeUndefined();
    });
});
