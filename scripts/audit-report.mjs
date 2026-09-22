import fs from "node:fs";

const report = JSON.parse(fs.readFileSync("data/reports/iphone-18-selected-tiktok.json", "utf8"));
const comments = report.evidence.filter((item) => item.recordType === "comment");
const frequencies = new Map();

for (const item of comments) {
  const text = String(item.text || "").trim();
  frequencies.set(text, (frequencies.get(text) || 0) + 1);
}

const patterns = {
  laughOrSarcasm: 0,
  price: 0,
  buyIntent: 0,
  waiting: 0,
  compareOldModel: 0,
  rejection: 0,
  expensive: 0,
  question: 0,
};

for (const item of comments) {
  const text = String(item.text || "").toLowerCase();
  if (includesAny(text, ["555", "😂", "🤣", "😅", "😆", "ประชด", "ขำ", "ฮา"])) patterns.laughOrSarcasm += 1;
  if (includesAny(text, ["ราคา", "บาท", "แพง", "ถูก", "คุ้ม", "หมื่น", "แสน"])) patterns.price += 1;
  if (includesAny(text, ["ซื้อ", "จัด", "เอา", "จอง", "ผ่อน"])) patterns.buyIntent += 1;
  if (includesAny(text, ["รอ", "รอซื้อ", "รอดู", "รออีก"])) patterns.waiting += 1;
  if (includesAny(text, ["17", "16", "15", "รุ่นก่อน", "ตัวเก่า", "pm", "pro max", "promax"])) {
    patterns.compareOldModel += 1;
  }
  if (includesAny(text, ["ไม่ซื้อ", "ซื้อไม่ไหว", "ไม่เอา", "ไม่ไหว", "พอแล้ว", "ยังไม่"])) {
    patterns.rejection += 1;
  }
  if (includesAny(text, ["แพง", "เกือบแสน", "ไม่คุ้ม", "แรง"])) patterns.expensive += 1;
  if (includesAny(text, ["?", "？", "ไหม", "มั้ย", "หรือ"])) patterns.question += 1;
}

const repeated = [...frequencies.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30)
  .map(([text, count]) => ({ count, text: text.slice(0, 160) }));

console.log(JSON.stringify({ comments: comments.length, unique: frequencies.size, patterns, repeated }, null, 2));

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}
