import { z } from "zod";

// Zod Schema to validate changelog category and items
export const ChangelogCategorySchema = z.enum(["MCP", "Platform", "Tool"]);
export type ChangelogCategory = z.infer<typeof ChangelogCategorySchema>;

export const ChangelogItemSchema = z.object({
  id: z.string(),
  version: z.string(),
  date: z.string(), // YYYY-MM-DD
  title: z.string(),
  category: ChangelogCategorySchema,
  description: z.string(),
  changes: z.array(z.string()),
});
export type ChangelogItem = z.infer<typeof ChangelogItemSchema>;

export const ChangelogDataSchema = z.array(ChangelogItemSchema);

// Static changelog entries
export const changelogsData: ChangelogItem[] = [
  {
    id: "ch-1",
    version: "v1.2.0",
    date: "2026-06-15",
    title: "เพิ่มการรองรับ Google Search Console & Analytics MCP",
    category: "MCP",
    description: "ขยายขีดความสามารถการทำ SEO และดึงรายงาน Analytics ผ่าน Model Context Protocol (MCP) เชื่อมต่อแบบ Real-time",
    changes: [
      "รองรับการเรียกใช้ MCP ของ Google Search Console เพื่อวิเคราะห์ Keywords และอันดับการค้นหา",
      "เพิ่ม endpoint ในการดึงข้อมูลทราฟฟิกเว็บไซต์จาก Google Analytics 4",
      "ปรับปรุงการเข้ารหัส Token สำหรับการ OAuth2 ปลอดภัยยิ่งขึ้นด้วยการป้องกันผ่าน Token Vault",
      "อัปเดตคู่มือการใช้งานและตัวอย่าง Prompts ในการวิเคราะห์รายงาน SEO"
    ]
  },
  {
    id: "ch-2",
    version: "v1.1.5",
    date: "2026-06-08",
    title: "เปิดตัว SQL Query Formatter & Visualizer Tool",
    category: "Tool",
    description: "เพิ่มเครื่องมือสำหรับนักพัฒนาในการวิเคราะห์และจัดฟอร์แมตคำสั่ง SQL พร้อมทั้งแสดงแผนการทำงาน (Query Execution Plan) ในรูปแบบกราฟ",
    changes: [
      "ระบบ Syntax Highlighting รองรับ PostgreSQL, MySQL, และ SQL Server",
      "เพิ่มการจัดฟอร์แมตอัตโนมัติ (Pretty Print) พร้อมความสามารถในการบีบอัดโค้ด (Minify)",
      "แชร์ Query ที่เซฟไว้ให้ทีมงานเข้ามาดูหรือแก้ไขร่วมกันได้แบบ Real-time",
      "ส่งออกประวัติการรัน Query และจัดกลุ่มตามแท็กโครงการเพื่อความสะดวกในการจัดการ"
    ]
  },
  {
    id: "ch-3",
    version: "v1.1.0",
    date: "2026-06-01",
    title: "อัปเกรดดีไซน์ระบบและรองรับ Tailwind CSS v4 & Next.js 16",
    category: "Platform",
    description: "ปรับปรุงสถาปัตยกรรมหลักของแอปพลิเคชันเพื่อรองรับประสิทธิภาพที่สูงขึ้นพร้อมสไตล์การออกแบบระดับพรีเมียม",
    changes: [
      "อัปเกรดระบบจัดสไตล์ไปใช้งาน Tailwind CSS v4 พร้อมปรับปรุง HSL Theme Tokens",
      "เพิ่มทรานซิชันและเอฟเฟกต์แอนิเมชันเปิดตัวหน้าจอ (Cinematic Reveal Animations) ลดค่า Cumulative Layout Shift (CLS)",
      "ติดตั้งระบบตรวจเช็คข้อมูล API Boundaries ด้วย Zod Validation เพื่อลดปัญหาหน้าจอค้าง",
      "รองรับ React 19 และฟังก์ชัน Server Components สำหรับหน้า Store และรายละเอียดเครื่องมือ"
    ]
  },
  {
    id: "ch-4",
    version: "v1.0.4",
    date: "2026-05-20",
    title: "รองรับ PostgreSQL และ MySQL Database Reflection MCP",
    category: "MCP",
    description: "เปิดโอกาสให้โมเดล AI สามารถอ่านโครงสร้างตารางข้อมูล (Database Schema) และให้คำแนะนำในการเขียน Query ได้โดยตรง",
    changes: [
      "สร้าง MCP Server สำหรับการดึงรายละเอียดตาราง, คอลัมน์, คีย์หลัก, และความสัมพันธ์ (Foreign Keys)",
      "ติดตั้งความปลอดภัยระดับสูง จำกัดเฉพาะคำสั่ง READ-ONLY เท่านั้น ป้องกันข้อมูลสูญหาย",
      "ทดสอบประสิทธิภาพและลดเวลาในการสแกนดึงข้อมูล Schema ลงกว่า 40%",
      "แสดงผลลัพธ์ผ่าน Console Visualizer ในรูปแบบตารางที่มีข้อมูลสรุปสถิติครบถ้วน"
    ]
  },
  {
    id: "ch-5",
    version: "v1.0.2",
    date: "2026-05-10",
    title: "เครื่องมือ Drag & Drop JSON Schema Validator",
    category: "Tool",
    description: "เครื่องมือสำหรับการตรวจสอบความถูกต้องของไฟล์ JSON เทียบกับ Schema มาตรฐาน ทำงานเสร็จสิ้นในฝั่ง Client",
    changes: [
      "รองรับการลากและวาง (Drag and Drop) ไฟล์ขนาดสูงสุด 10MB ได้อย่างลื่นไหล",
      "แสดงจุดที่ผิดพลาดอย่างชัดเจนพร้อมทั้งคำแนะนำแนวทางแก้ไขด้วยภาพประกอบพรีเมียม",
      "รองรับโครงสร้างมาตรฐาน Draft-07, Draft-2019-09, และ Draft-2020-12",
      "บันทึกประวัติการตรวจสอบล่าสุดไว้ใน LocalStorage เพื่อความสะดวกในการทำงานซ้ำ"
    ]
  },
  {
    id: "ch-6",
    version: "v1.0.0",
    date: "2026-05-01",
    title: "เปิดตัวระบบ Adapter Library Platform (v1.0.0)",
    category: "Platform",
    description: "ระบบศูนย์กลางที่รวบรวมเครื่องมือ, MCP, และโมเดล AI ทั้งหมดของทีมงานในที่เดียวเพื่อความคล่องตัวในการพัฒนาโครงการ",
    changes: [
      "พัฒนาระบบสมาชิกร่วมกับระบบล็อกอิน Zero-Trust ของกลุ่มบริษัท (ZT Token Cookie)",
      "หน้าแดชบอร์ดหลักสำหรับค้นหา คัดกรอง และดูการใช้งานทรัพยากรร่วมกันภายในทีม",
      "ระบบความปลอดภัย CSP (Content Security Policy) แบบเข้มงวดพร้อมระบบ dynamic nonce",
      "ดีไซน์การแสดงผลที่รวดเร็ว สดใหม่ และคงความพรีเมียมตามมาตรฐานขององค์กร"
    ]
  }
];

// Helper function to safely fetch and validate data
export function getValidatedChangelogs(): ChangelogItem[] {
  try {
    return ChangelogDataSchema.parse(changelogsData);
  } catch (error) {
    console.error("Failed to validate changelog data:", error);
    return [];
  }
}
