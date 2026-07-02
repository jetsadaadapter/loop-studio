export type Lang = "en" | "th";

type CtaItem = { label: string; action: string; href: string };

type BodySection = {
    label: string;
    heading: string;
    body: string[];
    items?: never;
    footer?: never;
};

type ItemSection = {
    label: string;
    heading: string;
    items: { term: string; detail: string }[];
    footer?: string;
    body?: never;
};

export type AboutSection = BodySection | ItemSection;

type LangCopy = {
    hero: { title: string; tagline: string; lead: string };
    sections: AboutSection[];
    cta: { primary: CtaItem; secondary: CtaItem };
};

export const aboutCopy: Record<Lang, LangCopy> = {
    en: {
        hero: {
            title: "Adapter Library",
            tagline: "The agency's collective brain.",
            lead: "One platform. Every tool, MCP, dataset, and skill we've built. Yours when you need it.",
        },
        sections: [
            {
                label: "Why this exists",
                heading: "Built so the best work doesn't disappear.",
                body: [
                    "Most agencies lose their best work the moment a project ends. The deck gets archived, the dataset gets buried, the smart prompt lives in one person's notes.",
                    "Adapter Library is built so that doesn't happen here.",
                    "Everything we make — internal SaaS, MCPs, datasets, skill libraries, the small scripts that save an hour a day — has a home. Searchable. Discoverable. Re-usable. By every team that has the access to use it.",
                    "The Library is how we turn scattered work into compounding advantage.",
                ],
            },
            {
                label: "What's inside",
                heading: "Tools across the whole company.",
                items: [
                    {
                        term: "Internal SaaS",
                        detail: "Full platforms built by Adapter for Adapter.",
                    },
                    {
                        term: "MCPs",
                        detail:
                            "Data and capability layers that plug into Claude, ChatGPT, and any AI tool you use.",
                    },
                    {
                        term: "Skill libraries",
                        detail:
                            "Skill.md packs that turn an LLM into a domain expert.",
                    },
                    {
                        term: "Datasets & data engines",
                        detail: "The central data we own and refresh.",
                    },
                    {
                        term: "Quick utilities",
                        detail: "Small tools that do one thing well, on quota.",
                    },
                ],
                footer:
                    "You see the tools you have access to. You can search across the rest. If your team builds something new, it ships into the Library too.",
            },
            {
                label: "Connected to the AI you already use",
                heading: "Stay in the workflow you trust.",
                body: [
                    "Your tools shouldn't ask you to leave the workflow you trust.",
                    "Adapter Library is built MCP-first. Whatever lives here can be called from Claude, ChatGPT, Cursor, or any client that speaks the protocol. Your data and our tools, in the AI surface you already work in.",
                ],
            },
            {
                label: "Built for the way Adapter ships",
                heading: "Fast for the right people. Guarded everywhere it matters.",
                body: [
                    "Per-app login, like an app store. Quota-based access where it matters. Guardrails on every tool that touches sensitive data. Per-team visibility so the right people see the right things.",
                    "The Library doesn't slow anyone down. It speeds the right people up.",
                ],
            },
            {
                label: "Made by Adapter, for Adapter",
                heading: "A workshop, not a showcase.",
                body: [
                    "Every tool here was built by a team in this company, for a problem they actually had. The Library is our portfolio in motion — not a showcase, a workshop. Use it. Improve it. Ship into it.",
                    "This is the operating system of the agency we want to be in five years.",
                    "We're starting now.",
                ],
            },
        ],
        cta: {
            primary: { label: "Find your tools", action: "Sign in", href: "/login" },
            secondary: {
                label: "Building something?",
                action: "Ship it to the Library",
                href: "#",
            },
        },
    },
    th: {
        hero: {
            title: "Adapter Library",
            tagline: "สมองรวมของเอเจนซี",
            lead: "แพลตฟอร์มเดียว รวมทุกเครื่องมือ MCP ดาตา และ skill ที่บริษัทสร้างมา พร้อมให้คุณใช้เมื่อต้องการ",
        },
        sections: [
            {
                label: "ทำไมถึงต้องมีสิ่งนี้",
                heading: "สร้างมาเพื่อให้งานดีๆ ไม่หายไป",
                body: [
                    "เอเจนซีส่วนใหญ่ทำงานดีๆ มาตลอด แต่พองานจบ ทุกอย่างก็หายไปกับ project — เด็คถูกเก็บ ดาตาถูกฝัง prompt ดีๆ อยู่ในโน้ตของคนเดียว",
                    "Adapter Library ถูกสร้างมาเพื่อให้สิ่งนั้นไม่เกิดขึ้นที่นี่",
                    "ทุกสิ่งที่บริษัทสร้าง — internal SaaS, MCP, ดาตา, skill library, สคริปต์เล็กๆ ที่ประหยัดเวลาวันละชั่วโมง — มีบ้านอยู่ที่นี่ ค้นหาได้ ค้นเจอได้ ใช้ซ้ำได้ โดยทุกทีมที่มีสิทธิ์ใช้",
                    "Library คือวิธีที่เราเปลี่ยนงานที่กระจัดกระจายให้กลายเป็นความได้เปรียบที่ทบดอกเบี้ย",
                ],
            },
            {
                label: "ข้างในมีอะไร",
                heading: "เครื่องมือจากทั่วทั้งบริษัท",
                items: [
                    {
                        term: "Internal SaaS",
                        detail: "แพลตฟอร์มเต็มรูปแบบที่ Adapter สร้างให้ Adapter ใช้",
                    },
                    {
                        term: "MCP",
                        detail:
                            "เลเยอร์ข้อมูลและความสามารถที่เชื่อมเข้า Claude, ChatGPT และ AI tool ที่คุณใช้อยู่",
                    },
                    {
                        term: "Skill library",
                        detail: "ชุด Skill.md ที่ทำให้ LLM กลายเป็นผู้เชี่ยวชาญในแต่ละด้าน",
                    },
                    {
                        term: "ดาตา & data engine",
                        detail: "ดาตากลางที่บริษัท own และอัปเดตให้",
                    },
                    {
                        term: "เครื่องมือเล็กๆ",
                        detail: "tool ที่ทำสิ่งเดียวแต่ทำได้ดี ใช้ได้ผ่าน quota",
                    },
                ],
                footer:
                    "คุณจะเห็นเครื่องมือที่คุณมีสิทธิ์ใช้ ค้นหาที่เหลือได้ และถ้าทีมคุณสร้างอะไรใหม่ ก็ ship เข้ามาที่นี่ได้เช่นกัน",
            },
            {
                label: "เชื่อมเข้ากับ AI ที่คุณใช้อยู่แล้ว",
                heading: "ทำงานใน workflow ที่คุณคุ้นอยู่แล้ว",
                body: [
                    "เครื่องมือไม่ควรบังคับให้คุณออกจาก workflow ที่คุณคุ้น",
                    "Adapter Library ถูกสร้างมาแบบ MCP-first ทุกอย่างที่อยู่ที่นี่เรียกใช้ได้จาก Claude, ChatGPT, Cursor หรือ client ใดก็ตามที่พูดโปรโตคอลเดียวกัน — ดาตาและเครื่องมือของเรา ในหน้า AI ที่คุณทำงานอยู่จริง",
                ],
            },
            {
                label: "สร้างมาเพื่อการ ship แบบ Adapter",
                heading: "เร็วสำหรับคนที่ควรเร็ว คุมได้ในทุกจุดที่สำคัญ",
                body: [
                    "Login รายแอปเหมือน app store มี quota ในจุดที่ต้องคุม มี guardrail ทุกเครื่องมือที่แตะข้อมูลสำคัญ และเห็นรายทีม — เพื่อให้คนที่ควรเห็น เห็นในสิ่งที่ควรเห็น",
                    "Library ไม่ทำให้ใครช้าลง — แต่ทำให้คนที่ควรไปเร็ว ไปได้เร็วขึ้น",
                ],
            },
            {
                label: "สร้างโดย Adapter เพื่อ Adapter",
                heading: "Workshop ไม่ใช่ตู้โชว์",
                body: [
                    "ทุกเครื่องมือที่นี่ถูกสร้างโดยทีมในบริษัท แก้โจทย์จริงที่ทีมนั้นมี Library คือ portfolio ของบริษัทที่กำลังเคลื่อนไหวอยู่ — ไม่ใช่ตู้โชว์ แต่เป็น workshop ใช้มัน ปรับมัน ship เข้ามาในนั้น",
                    "นี่คือระบบปฏิบัติการของเอเจนซีที่เราอยากเป็นในอีก 5 ปี",
                    "เราเริ่มทำตั้งแต่วันนี้",
                ],
            },
        ],
        cta: {
            primary: {
                label: "ค้นหาเครื่องมือของคุณ",
                action: "เข้าสู่ระบบ",
                href: "/login",
            },
            secondary: {
                label: "กำลังสร้างอะไรอยู่?",
                action: "Ship เข้ามาที่ Library",
                href: "#",
            },
        },
    },
};
