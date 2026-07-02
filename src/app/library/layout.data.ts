import { LEGAL_LINKS, CONTACT_LINKS } from "@/lib/legal-links";

type FooterLinkItem = {
    label: string;
    href: string;
};

export const libraryFooterLinks: Record<string, FooterLinkItem[]> = {
    Library: [
        { label: "MCP", href: "/apps?category=mcp" },
        { label: "Platform", href: "/apps?category=platform" },
        { label: "Tool", href: "/apps?category=tool" },
    ],
    Updates: [
        { label: "Submit an App", href: CONTACT_LINKS.requestForm },
        { label: "Changelog", href: "/changelogs" },
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