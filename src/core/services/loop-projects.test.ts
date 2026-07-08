import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProjects, calculateRiskTier, isHostProject } from "./loop-projects.service";

vi.mock("fs", () => {
    const mockData = JSON.stringify([
        {
            id: "test-proj",
            name: "Test Project",
            path: "/fake/path",
            template: "nextjs-app",
            tasks: [],
            createdAt: "",
            updatedAt: "",
        }
    ]);
    return {
        default: {
            existsSync: () => true,
            readFileSync: () => mockData,
            writeFileSync: () => {},
            mkdirSync: () => {},
            readdirSync: () => [],
            statSync: () => ({ isDirectory: () => false })
        },
        existsSync: () => true,
        readFileSync: () => mockData,
        writeFileSync: () => {},
        mkdirSync: () => {},
        readdirSync: () => [],
        statSync: () => ({ isDirectory: () => false })
    };
});

describe("Loop Projects Service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should fetch projects registered in configuration", () => {
        const projects = getProjects();
        expect(projects).toBeDefined();
        expect(projects.length).toBe(1);
        expect(projects[0].name).toBe("Test Project");
    });

    it("should calculate Risk Tier for green leaf components", () => {
        const result = calculateRiskTier("/fake/path", "src/components/ui/leaf.tsx");
        expect(result.tier).toBe("GREEN");
        expect(result.count).toBe(0);
    });
});

describe("isHostProject", () => {
    it("is true for the app's own working directory", () => {
        expect(isHostProject(process.cwd())).toBe(true);
    });

    it("is true for an unnormalized path to the same directory", () => {
        expect(isHostProject(process.cwd() + "/./")).toBe(true);
    });

    it("is false for any other project directory", () => {
        expect(isHostProject("/tmp/some-other-project")).toBe(false);
        expect(isHostProject(process.cwd() + "/.projects/child")).toBe(false);
    });
});
