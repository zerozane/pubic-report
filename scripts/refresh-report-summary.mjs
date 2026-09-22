import fs from "node:fs";

const reportPath = "data/reports/iphone-18-selected-tiktok.json";
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const comments = report.evidence.filter((item) => item.recordType === "comment");
const posts = report.evidence.filter((item) => item.recordType === "post");
const bySentiment = countBy(comments, (item) => item.sentiment || "unclassified");
const byTopic = new Map();

for (const item of comments) {
  for (const topic of item.topics || []) {
    if (["ความคิดเห็นไทย", "ความคิดเห็นหลายภาษา"].includes(topic)) continue;
    byTopic.set(topic, (byTopic.get(topic) || 0) + 1);
  }
}

const topTopics = [...byTopic.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
const classified = comments.length || 1;
const positivePercent = Math.round(((bySentiment.positive || 0) / classified) * 100);
const negativePercent = Math.round(((bySentiment.negative || 0) / classified) * 100);

report.summary = `รายงานรอบลึกนี้ใช้ ${posts.length} โพสต์ TikTok และ ${comments.length.toLocaleString(
  "th-TH",
)} คอมเมนต์เกี่ยวกับ iPhone 18 หลังอ่านกลุ่มข้อความสำคัญแบบ manual review พบเชิงบวก ${positivePercent}% เชิงลบ ${negativePercent}% และส่วนใหญ่เป็นกลาง/นอกประเด็น/ข้อความสั้น ประเด็นที่ต้องระวังคือราคา ความคุ้มค่า และมุกประชดเรื่องการเลี่ยงซื้อ`;

report.insights = [
  {
    id: "insight-price-resistance",
    type: "concern",
    title: "แรงต้านหลักคือราคาและความคุ้มค่า",
    description: `พบข้อความราคา/ความคุ้มค่า ${byTopic.get("ราคา/ความคุ้มค่า") || 0} รายการ และหลายเคสที่ manual review ปรับเป็นเชิงลบ เพราะสื่อถึงราคาแพง ราคาเป็นแสน หรือเอาเงินไปซื้ออย่างอื่นคุ้มกว่า`,
    evidenceIds: selectEvidence(comments, ["ราคา/ความคุ้มค่า"], "negative", 5),
    recommendation: "อย่าสรุปว่าคำว่าอยากได้หรือรอซื้อเป็นบวกทันที ควรแยกกลุ่มราคาแพง/ประชดออกจาก intent ซื้อจริง",
  },
  {
    id: "insight-sarcasm",
    type: "concern",
    title: "มุกประชดทำให้ sentiment เพี้ยนได้ง่าย",
    description: `พบมุก/ประชด ${byTopic.get("มุก/ประชด") || 0} รายการ เช่น ประชดเรื่องเครื่องละแสน ขายรถขายบ้าน หรือรอรุ่นถัดไปเรื่อยๆ ซึ่งควรอ่านเป็นแรงต้านมากกว่าความตื่นเต้น`,
    evidenceIds: selectEvidence(comments, ["มุก/ประชด"], "negative", 5),
    recommendation: "เวลารีวิวรอบถัดไปให้แยก sarcasm เป็น topic เฉพาะ และไม่ใช้ keyword ซื้อ/รอ เป็นบวกโดยอัตโนมัติ",
  },
  {
    id: "insight-low-signal",
    type: "opportunity",
    title: "ข้อมูลจำนวนมากเป็นสัญญาณต่ำหรือนอกประเด็น",
    description: `มีข้อความสั้น/อีโมจิ ${byTopic.get("ข้อความสั้น/อีโมจิ") || 0} รายการ และนอกประเด็น/แก้ข้อมูล ${byTopic.get("นอกประเด็น/แก้ข้อมูล") || 0} รายการ จึงควรใช้เป็นบริบท engagement ไม่ใช่หลักฐาน sentiment หลัก`,
    evidenceIds: selectEvidence(comments, ["ข้อความสั้น/อีโมจิ", "นอกประเด็น/แก้ข้อมูล"], "neutral", 5),
    recommendation: "รายงานควรแยกฐานคำนวณระหว่าง comment ทั้งหมดกับ comment ที่ตีความได้จริง",
  },
  {
    id: "insight-real-interest",
    type: "strength",
    title: "ยังมีความสนใจจริง แต่เล็กกว่าที่ rule-based เห็น",
    description: `หลัง manual review ยังมีข้อความเชิงบวก ${bySentiment.positive || 0} รายการ ส่วนใหญ่เป็นการอยากได้หรือรอซื้อแบบตรงไปตรงมา แต่ต้องแยกออกจากคำขอแจกเครื่องและมุกประชด`,
    evidenceIds: selectEvidence(comments, ["ตั้งใจซื้อ/รออัปเกรด"], "positive", 5),
    recommendation: "ใช้ positive เป็นกลุ่ม lead อ่อนๆ และเน้นตรวจซ้ำว่าข้อความนั้นเป็น intent จริง ไม่ใช่ขอของหรือเล่นมุก",
  },
];

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ comments: comments.length, bySentiment, topTopics, insights: report.insights.length }, null, 2));

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function selectEvidence(items, topics, sentiment, limit) {
  return items
    .filter((item) => item.sentiment === sentiment && topics.some((topic) => item.topics?.includes(topic)))
    .sort((a, b) => (b.metrics?.likes || 0) - (a.metrics?.likes || 0))
    .slice(0, limit)
    .map((item) => item.id);
}
