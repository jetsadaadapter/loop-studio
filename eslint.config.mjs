import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Tooling/runtime dir (IDE bridge scripts, logs, project data) — not app source.
    ".antigravity/**",
    // Bootstrapped/registered projects live in their own repos — never lint them here.
    ".projects/**",
  ]),
]);

export default eslintConfig;
