import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PreviewAppView } from "./PreviewAppView";

const baseProps = {
    url: "http://localhost:3000",
    inputUrl: "http://localhost:3000",
    onInputUrlChange: () => {},
    onLoadUrl: () => {},
    onReload: () => {},
    onRetry: async () => {},
    reloadKey: 0,
    reachable: true,
    apiCapable: false,
    previewKind: "app" as const,
    bodyKind: "app" as const,
    onSelectApp: () => {},
    onSelectApi: () => {},
    deviceMode: "desktop" as const,
    projectId: "proj-1",
};

describe("PreviewAppView", () => {
    it("disables the live preview for the host app (no iframe, shows explanation)", () => {
        render(<PreviewAppView {...baseProps} isHost />);
        expect(screen.getByText(/Live preview is off for the host app/i)).toBeInTheDocument();
        expect(screen.queryByTitle("Live app preview")).toBeNull();
    });

    it("renders the live iframe for a normal, reachable project", () => {
        render(<PreviewAppView {...baseProps} isHost={false} />);
        expect(screen.getByTitle("Live app preview")).toBeInTheDocument();
        expect(screen.queryByText(/Live preview is off for the host app/i)).toBeNull();
    });
});
