import { describe, it, expect } from "vitest";
import { shq, buildWrapperScript, tmuxSessionName } from "./loop-tmux.service";

describe("shq (POSIX single-quote escape)", () => {
    it("wraps a plain string in single quotes", () => {
        expect(shq("hello")).toBe("'hello'");
    });
    it("escapes embedded single quotes as '\\''", () => {
        expect(shq("a'b")).toBe("'a'\\''b'");
    });
    it("leaves other shell metacharacters inert inside the quotes", () => {
        // ; ` $() are just literal characters once single-quoted.
        expect(shq("; `id` $(whoami)")).toBe("'; `id` $(whoami)'");
    });
});

describe("buildWrapperScript is injection-safe", () => {
    const cwd = "/proj/dir";
    const out = "/w/out", err = "/w/err", exit = "/w/exit";

    it("quotes cwd, bin, args, and redirections", () => {
        const w = buildWrapperScript("claude", ["-p", "hi", "--output-format", "json"], cwd, out, err, exit);
        expect(w).toContain("cd '/proj/dir' || exit 1");
        expect(w).toContain("'claude' '-p' 'hi' '--output-format' 'json'");
        expect(w).toContain("> '/w/out' 2> '/w/err'");
        expect(w).toContain("echo $? > '/w/exit'");
    });

    it("neutralizes a malicious prompt — it appears only as a single-quoted unit", () => {
        const evil = "hi; touch /tmp/PWNED; echo `id`; $(whoami)";
        const w = buildWrapperScript("claude", ["-p", evil], cwd, out, err, exit);
        // Safety = the payload is embedded exactly as shq(evil) (one quoted arg
        // right after '-p'); the shell never re-parses its contents. Proven at
        // runtime too (see the plan's injection probe).
        expect(w).toContain("'-p' " + shq(evil));
    });

    it("handles a prompt that tries to break out of the single quotes", () => {
        const breakout = "x'; rm -rf ~; echo '";
        // Every ' becomes '\'' so the arg can never terminate its own quoting early.
        expect(shq(breakout)).toBe("'x'\\''; rm -rf ~; echo '\\'''");
        expect(buildWrapperScript("gemini", ["-p", breakout], cwd, out, err, exit)).toContain(shq(breakout));
    });
});

describe("tmuxSessionName", () => {
    it("prefixes loop- and sanitizes the task id", () => {
        expect(tmuxSessionName("task-123-0")).toBe("loop-task-123-0");
        expect(tmuxSessionName("a/b c;d")).toBe("loop-a_b_c_d");
    });
});
