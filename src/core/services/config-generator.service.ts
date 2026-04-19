import type { MCPResource } from "@/core/validators/resource.validator";

const COMMAND_ALLOWLIST = new Set(["npx", "node", "python3", "uvx"]);
const ENV_KEY_ALLOWLIST = new Set(["NODE_ENV", "MCP_API_KEY", "MCP_BASE_URL"]);

export interface ClaudeDesktopConfig {
    mcpServers: Record<
        string,
        { command: string; args: string[]; env?: Record<string, string> }
    >;
}

export function generateClaudeDesktopConfig(
    mcp: MCPResource
): ClaudeDesktopConfig {
    const { command, args, env } = mcp.config;

    if (!COMMAND_ALLOWLIST.has(command)) {
        throw new Error(`Command "${command}" is not on the approved allowlist.`);
    }

    const safeEnv: Record<string, string> = {};
    if (env) {
        for (const [key, value] of Object.entries(env)) {
            if (ENV_KEY_ALLOWLIST.has(key) && typeof value === "string") {
                safeEnv[key] = value;
            }
        }
    }

    return {
        mcpServers: {
            [mcp.id]: {
                command,
                args,
                ...(Object.keys(safeEnv).length > 0 ? { env: safeEnv } : {}),
            },
        },
    };
}
