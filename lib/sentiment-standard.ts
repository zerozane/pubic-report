import type { Sentiment } from "@/lib/types";

export const sentimentStandard: Array<{
  value: Sentiment;
  label: string;
  definition: string;
  examples: string[];
}> = [
  {
    value: "positive",
    label: "เชิงบวก",
    definition: "คำชม ความสนใจซื้อ หรือประสบการณ์ที่ดี",
    examples: ["สีสวยมาก", "อยากได้", "ใช้ดี", "แพ็กเกจน่ารัก"],
  },
  {
    value: "neutral",
    label: "เป็นกลาง",
    definition: "คำถาม ข้อมูลทั่วไป ข้อความสั้น อีโมจิ หรือข้อความที่ยังไม่มีทิศทางชัดเจน",
    examples: ["ราคาเท่าไหร่", "ซื้อที่ไหน", "สีอะไร", "มีขายไหม"],
  },
  {
    value: "negative",
    label: "เชิงลบ",
    definition: "คำร้องเรียน ความไม่พอใจ การปฏิเสธสินค้า หรือปัญหาจากการใช้งานที่ระบุชัดเจน",
    examples: ["แพงเกินไป", "ของหมด", "ใช้แล้วไม่รอด", "แพ้และระคายเคือง"],
  },
];

export const sentimentLexicon = {
  positive: ["ดี", "ดีมาก", "สวย", "น่ารัก", "ชอบ", "อยากได้", "ต้องมี", "จึ้ง", "ปัง", "เริ่ด", "ใช้ดี", "ติดทน"],
  neutral: ["เฉยๆ", "น่าลอง", "ราคาเท่าไหร่", "ซื้อที่ไหน", "สีอะไร", "มีขายไหม", "พิกัด"],
  negative: ["ไม่ชอบ", "ไม่ดี", "ไม่คุ้ม", "ไม่รอด", "ผิดหวัง", "แพงเกิน", "พัง", "แพ้", "แสบ", "ระคายเคือง", "เป็นคราบ", "ปลอม", "ส่งช้า"],
  ambiguous: ["แรง", "ตาย", "ฉ่ำ", "ไม่ไหว"],
} as const;

export const sentimentContextRules = [
  { term: "ไม่ไหว", positiveWhen: ["รอ", "สวย", "ชอบ", "เริ่ด", "จึ้ง", "ปัง"], negativeWhen: ["ใช้", "แพ้", "แสบ", "ระคาย"] },
  { term: "แรง", positiveWhen: ["สี", "เม็ดสี", "ชัด", "สวย", "จึ้ง", "ปัง"], negativeWhen: ["ราคา", "แพง", "กลิ่น", "ระคาย", "แสบ"] },
  { term: "ฉ่ำ", positiveWhen: ["ผิว", "ปาก", "สี", "สวย", "วาว"], negativeWhen: ["เหนียว", "เยิ้ม"] },
] as const;

// Mirrors the --sentiment-* tokens in app/globals.css for SVG/inline chart fills.
export const sentimentColors: Record<Sentiment, string> = {
  positive: "#10b981",
  neutral: "#f59e0b",
  negative: "#f43f5e",
};

export const sentimentStandardMethod =
  "จัด sentiment จากความหมายของข้อความเท่านั้น ไม่ใช้ likes/views/shares เป็นตัวตัดสิน: เชิงบวก = คำชม ความสนใจซื้อ หรือประสบการณ์ดี; เป็นกลาง = คำถาม ข้อมูลทั่วไป ข้อความสั้น อีโมจิ หรือข้อความที่ยังไม่มีทิศทางชัดเจน; เชิงลบ = คำร้องเรียน ความไม่พอใจ การปฏิเสธสินค้า หรือปัญหาจากการใช้งานที่ระบุชัดเจน";
