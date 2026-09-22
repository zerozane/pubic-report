import fs from "node:fs";
import path from "node:path";

const reportPath = "data/reports/iphone-18-selected-tiktok.json";
const outputPath = "work/review/iphone18-ai-review-groups.json";
const negativeSignals = [
  "แพง",
  "แปง",
  "ไม่ซื้อ",
  "ไม่เอา",
  "ไม่ไหว",
  "เลิกใช้",
  "ดีกว่า",
  "เกินไป",
  "ไม่คุ้ม",
  "ไม่มีประโยชน์",
  "รำคาญ",
  "เสียดาย",
  "ตัดใจ",
  "กู้",
  "หนี้",
  "ตกรุ่น",
  "เศษเหล็ก",
  "เข็ด",
  "เครื่องละแสน",
  "ราคา",
];
const sarcasmSignals = [
  "555",
  "😂",
  "🤣",
  "😅",
  "😆",
  "😁",
  "ประชด",
  "ขำ",
  "ฮา",
  "เอาไว้โทร",
  "ซื้อมาทับ",
];
const ambiguousSignals = [
  "อยากได้",
  "รอ",
  "ซื้อ",
  "ขอได้ไหม",
  "ให้จริง",
  "แม่ไม่ซื้อ",
  "เครื่องเก่า",
  "แบตเสื่อม",
  "ค้าง",
  "แตก",
  "iphone 17",
  "15m",
];
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const comments = report.evidence.filter((item) => item.recordType === "comment");
const groups = new Map();

for (const item of comments) {
  const text = String(item.text || "").trim();
  const key = text.toLowerCase().replace(/\s+/g, " ");
  const existing = groups.get(key) || {
    text,
    ids: [],
    count: 0,
    likes: 0,
    currentSentiments: {},
    currentTopics: {},
  };
  existing.ids.push(item.id);
  existing.count += 1;
  existing.likes += item.metrics?.likes || 0;
  existing.currentSentiments[item.sentiment] = (existing.currentSentiments[item.sentiment] || 0) + 1;
  for (const topic of item.topics || []) {
    existing.currentTopics[topic] = (existing.currentTopics[topic] || 0) + 1;
  }
  groups.set(key, existing);
}

const rows = [...groups.values()]
  .map((group) => ({
    ...group,
    reviewPriority: getReviewPriority(group),
  }))
  .sort((a, b) => b.reviewPriority - a.reviewPriority || b.likes - a.likes || b.count - a.count);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      outputPath,
      comments: comments.length,
      uniqueTexts: rows.length,
      highPriority: rows.filter((row) => row.reviewPriority >= 10).length,
      mediumPriority: rows.filter((row) => row.reviewPriority >= 5 && row.reviewPriority < 10).length,
    },
    null,
    2,
  ),
);

function getReviewPriority(group) {
  const text = group.text.toLowerCase();
  let score = 0;
  if (group.likes >= 100) score += 10;
  else if (group.likes >= 10) score += 6;
  else if (group.likes >= 1) score += 2;
  if (group.count >= 20) score += 6;
  else if (group.count >= 5) score += 3;
  if (containsAny(text, negativeSignals)) score += 10;
  if (containsAny(text, sarcasmSignals)) score += 7;
  if (containsAny(text, ambiguousSignals)) score += 5;
  if ((group.currentSentiments.positive || 0) > 0 && containsAny(text, negativeSignals)) score += 10;
  return score;
}

function containsAny(text, words) {
  return words.some((word) => text.includes(word));
}
