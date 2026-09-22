import fs from "node:fs";

const report = JSON.parse(fs.readFileSync("data/reports/iphone-18-selected-tiktok.json", "utf8"));
const comments = report.evidence.filter((item) => item.recordType === "comment");

const negativeSignals = [
  "ไม่ซื้อ",
  "ไม่เอา",
  "ไม่ไหว",
  "ไม่เปลี่ยน",
  "เลิกใช้",
  "แพง",
  "แปง",
  "แพ๊ง",
  "พอแล้ว",
  "ดีกว่า",
  "ตัดใจ",
  "ขายตับ",
  "กู้",
  "หนี้",
  "เสื่อม",
  "ค้าง",
  "รำคาญ",
  "ไม่มีประโยชน์",
  "ไม่คุ้ม",
  "เกินไป",
  "แม่ง",
  "ทำไมมันเพิ่ม",
  "เครื่องละแสน",
  "ราคาเริ่มต้นที่ 1 ล้าน",
  "ซื้อรถ",
  "ซื้อวัว",
  "ซื้องัว",
  "ซื้อทอง",
  "เอาไว้โทร",
];

const rows = comments
  .filter((item) => item.sentiment !== "negative")
  .filter((item) => {
    const text = String(item.text || "").toLowerCase();
    return negativeSignals.some((signal) => text.includes(signal));
  })
  .sort((a, b) => (b.metrics?.likes || 0) - (a.metrics?.likes || 0))
  .map((item) => ({
    id: item.id,
    sentiment: item.sentiment,
    likes: item.metrics?.likes || 0,
    topics: item.topics,
    text: item.text,
  }));

console.log(JSON.stringify({ count: rows.length, rows: rows.slice(0, 120) }, null, 2));
