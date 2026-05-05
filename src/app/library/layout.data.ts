import { LEGAL_LINKS } from "@/lib/legal-links";

export type FooterLinkItem = {
    label: string;
    href: string;
};

export const libraryFooterLinks: Record<string, FooterLinkItem[]> = {
    Library: [
        { label: "MCP", href: "#" },
        { label: "Platform", href: "#" },
        { label: "Tool", href: "#" },
    ],
    Updates: [
        { label: "Submit an App", href: "#" },
        { label: "Changelog", href: "#" },
    ],
    Company: [
        { label: "About", href: "/about" },
        { label: "Privacy Policy", href: LEGAL_LINKS.privacyPolicy },
        { label: "Terms of Service", href: LEGAL_LINKS.termsOfService },
    ],
};

export const libraryShellCopy = {
    title: "Adapter Library",
    tagline: "The agency's collective brain.",
    description:
        "One platform. Every tool, MCP, dataset, and skill we've built. Yours when you need it.",
};