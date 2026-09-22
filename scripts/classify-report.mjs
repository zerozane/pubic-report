import fs from "node:fs";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const reportPath = args.input || "data/reports/iphone-18-selected-tiktok.json";
const absolutePath = path.resolve(process.cwd(), reportPath);

if (!fs.existsSync(absolutePath)) {
  console.error(`Report not found: ${reportPath}`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
const evidence = Array.isArray(report.evidence) ? report.evidence : [];

const posts = evidence.filter((item) => item.recordType === "post");
const comments = evidence.filter((item) => item.recordType === "comment");

let classifiedComments = 0;
const topicCounts = new Map();
const sentimentCounts = new Map([
  ["positive", 0],
  ["neutral", 0],
  ["negative", 0],
]);

for (const item of evidence) {
  const classification = classifyEvidence(item);
  item.sentiment = classification.sentiment;
  item.topics = classification.topics;

  if (item.recordType === "comment") {
    classifiedComments += 1;
    sentimentCounts.set(item.sentiment, (sentimentCounts.get(item.sentiment) || 0) + 1);
    for (const topic of item.topics) {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    }
  }
}

const totalComments = comments.length || 1;
const topTopics = [...topicCounts.entries()]
  .filter(([topic]) => topic !== "ความคิดเห็นไทย" && topic !== "ความคิดเห็นหลายภาษา")
  .sort((a, b) => b[1] - a[1])
  .slice(0, 8);

report.status = "draft";
report.summary = buildSummary({
  comments: comments.length,
  posts: posts.length,
  positive: sentimentCounts.get("positive") || 0,
  neutral: sentimentCounts.get("neutral") || 0,
  negative: sentimentCounts.get("negative") || 0,
  topTopics,
});
report.methodology = {
  ...report.methodology,
  sentimentMethod:
    "จัดประเภทเบื้องต้นด้วยกฎคำสำคัญไทย/อังกฤษ แล้วควรตรวจทานตัวอย่างก่อนเผยแพร่",
  limitations: [
    "ชุดข้อมูลมาจาก TikTok เฉพาะโพสต์ที่เลือก ไม่ใช่บทสนทนาทั้งหมดบนโซเชียล",
    "การจัดประเภทเป็น rule-based จึงอาจตีความมุก ประชด หรือบริบทเฉพาะผิดได้",
    "จำนวนข้อความไม่เท่ากับจำนวนผู้ซื้อหรือขนาดตลาด",
  ],
};
report.insights = buildInsights(evidence, topicCounts, sentimentCounts, totalComments);

fs.writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      report: reportPath,
      posts: posts.length,
      comments: comments.length,
      classifiedComments,
      sentiment: Object.fromEntries(sentimentCounts),
      topTopics,
      insights: report.insights.length,
    },
    null,
    2,
  ),
);

function classifyEvidence(item) {
  if (item.recordType === "post") {
    return {
      sentiment: "neutral",
      topics: unique(["โพสต์ต้นทาง", "iPhone 18", ...topicsForText(item.text)]),
    };
  }

  const text = normalize(item.text);
  const topics = topicsForText(text);
  const sentiment = sentimentForText(text, topics);

  if (containsThai(text)) topics.push("ความคิดเห็นไทย");
  else topics.push("ความคิดเห็นหลายภาษา");

  if (!topics.length) topics.push("อื่นๆ/รอตรวจทาน");

  return {
    sentiment,
    topics: unique(topics).slice(0, 5),
  };
}

function topicsForText(value) {
  const text = normalize(value);
  const topics = [];

  if (isLowSignalText(text)) {
    topics.push("ข้อความสั้น/อีโมจิ");
  }
  if (isOffTopicOrCorrection(text)) {
    topics.push("นอกประเด็น/แก้ข้อมูล");
  }
  if (matches(text, ["ราคา", "บาท", "แพง", "ถูก", "คุ้ม", "ไม่คุ้ม", "49", "เกือบแสน", "หมื่น"])) {
    topics.push("ราคา/ความคุ้มค่า");
  }
  if (
    !isOffTopicOrCorrection(text) &&
    matches(text, ["รอ", "ซื้อ", "จัด", "เอา", "เปลี่ยน", "อัป", "อัพ", "upgrade", "จอง", "รอจัด", "ผ่อน", "อยากได้"])
  ) {
    topics.push("ตั้งใจซื้อ/รออัปเกรด");
  }
  if (matches(text, ["17", "16", "15", "รุ่นก่อน", "ตัวเก่า", "โปรแมก", "promax", "pro max"])) {
    topics.push("เทียบรุ่นก่อน");
  }
  if (matches(text, ["กล้อง", "แบต", "ชิป", "จอ", "สเปค", "สเปก", "ความจุ", "ram", "chip", "camera", "battery"])) {
    topics.push("ฟีเจอร์/สเปก");
  }
  if (matches(text, ["สี", "ดีไซน์", "ทรง", "หน้าตา", "บาง", "เบา", "design", "color"])) {
    topics.push("ดีไซน์/สี");
  }
  if (matches(text, ["เปิดตัว", "เข้าไทย", "ขาย", "วางขาย", "กันยา", "ปีหน้า", "เมื่อไหร่", "วันไหน"])) {
    topics.push("วันเปิดตัว/เข้าไทย");
  }
  if (matches(text, ["ศูนย์", "โปร", "ส่วนลด", "ผ่อน", "ais", "dtac", "true", "istudio", "apple store"])) {
    topics.push("โปร/ช่องทางซื้อ");
  }
  if (matches(text, ["ข่าวลือ", "จริงไหม", "มั่ว", "หลอก", "fake", "rumor", "คอนเซป", "concept"])) {
    topics.push("ข่าวลือ/ความน่าเชื่อถือ");
  }
  if (
    matches(text, [
      "555",
      "😂",
      "🤣",
      "😅",
      "😆",
      "😁",
      "ขำ",
      "ฮา",
      "มุก",
      "ประชด",
      "แซว",
      "ตลก",
      "ตัดใจ",
      "เอาไว้โทร",
    ])
  ) {
    topics.push("มุก/ประชด");
  }

  return topics;
}

function sentimentForText(text, topics) {
  if (isShortNegativeText(text)) return "negative";
  if (isLowSignalText(text)) {
    return "neutral";
  }

  if (isOffTopicOrCorrection(text)) return "neutral";
  if (isValueRejection(text)) return "negative";
  if (isProductCriticism(text)) return "negative";
  if (isDeviceProblemRequest(text)) return "neutral";
  if (isUncertainOrPracticalEvaluation(text)) return "neutral";

  const negativeHits = countMatches(text, [
    "แพง",
    "แปง",
    "แพ๊ง",
    "ไม่คุ้ม",
    "ไม่ซื้อ",
    "ซื้อไม่ไหว",
    "ไม่มีเงิน",
    "เกินไป",
    "เสียดาย",
    "ผิดหวัง",
    "แย่",
    "เบื่อ",
    "ไม่เอา",
    "พอแล้ว",
    "ยังไม่",
    "เลิกใช้",
    "ตัดใจ",
    "แปลก",
    "เอาไว้โทร",
    "จั๊กจี้",
    "หลอก",
    "มั่ว",
    "แพงมาก",
    "เกือบแสน",
    "มอเตอร์ไซค์",
    "มอเตอร์ไซ",
    "ซื้อรถ",
    "ซื้อวัว",
    "ซื้องัว",
    "ซื้อทอง",
    "ซื้อ android",
    "ซื้อandroid",
    "ดีกว่า",
    "ทำไมวะ",
    "no!",
    "กูno",
    "กู้หนี้",
    "ยืมสิน",
    "ตกรุ่น",
    "ไม่มีประโยชน์",
    "รำคาญ",
    "หัวจะปวด",
    "โหดมาก",
    "บังคับ",
    "เศษเหล็ก",
    "เข็ด",
  ]);
  const positiveHits = countMatches(text, [
    "ซื้อ",
    "รอ",
    "จัด",
    "เอา",
    "ชอบ",
    "สวย",
    "ดี",
    "คุ้ม",
    "น่าสน",
    "อยากได้",
    "รอเลย",
    "upgrade",
    "อัป",
    "อัพ",
    "รัก",
    "เย้",
  ]);
  const sarcasmHits = countMatches(text, [
    "555",
    "😂",
    "🤣",
    "😅",
    "😆",
    "😁",
    "ประชด",
    "ขำ",
    "ฮา",
    "ตัดใจ",
    "เอาไว้โทร",
  ]);
  const questionHits = countMatches(text, ["?", "？", "ไหม", "มั้ย", "หรือ"]);

  if (negativeHits > 0 && (sarcasmHits > 0 || topics.includes("ราคา/ความคุ้มค่า"))) return "negative";
  if (negativeHits >= positiveHits && negativeHits > 0) return "negative";
  if (sarcasmHits > 0 && (topics.includes("ราคา/ความคุ้มค่า") || topics.includes("เทียบรุ่นก่อน"))) return "neutral";
  if (questionHits > 0 && topics.includes("ราคา/ความคุ้มค่า")) return "neutral";

  if (positiveHits > 0 && negativeHits === 0 && sarcasmHits === 0) return "positive";
  return "neutral";
}

function isOffTopicOrCorrection(text) {
  return matches(text, [
    "15m",
    "15 m",
    "ล้านแล้ว",
    "ติดตาม",
    "กลุ่ม",
    "ตามมาจาก",
    "ไม่ใช่หรอ",
    "ไม่ใช่เหรอ",
    "ใช่หรอ",
    "ใช่เหรอ",
    "อันนั้น iphone 17",
    "มันเป็น iphone 17",
    "มีใครอยุ่กลุ่ม",
    "มีใครอยู่กลุ่ม",
  ]);
}

function isValueRejection(text) {
  if (
    matches(text, [
      "ซื้อรถ",
      "ซื้อวัว",
      "ซื้องัว",
      "ซื้อทอง",
      "ซื้อ android",
      "ซื้อandroid",
      "ทำบ้านดีกว่า",
      "redmaigc",
      "รอไอโฟน 19",
      "รอไอโพน 19",
      "รอไอโฟน 20",
      "รอ iphone 20",
    ])
  ) {
    return true;
  }
  if (text.includes("ซื้อ") && matches(text, ["ดีกว่า", "ทำไมวะ", "เอาเงินไป", "ไม่ไหว", "ไม่คุ้ม", "ไม่ซื้อเด็ดขาด", "ไม่เอา"])) return true;
  if (matches(text, ["ไม่ซื้อหรอก", "ไม่ซื้อเด็ดขาด", "ดูอย่างเดียวไม่ซื้อ", "เงินในกระเป๋าฉันอยู่ครบ"])) return true;
  if (matches(text, ["ใครจะซื้อก่อเหอะ", "กูคนนึงไม่เอา", "ใครจะไม่ซื้อ ได้หรอ", "ซื้อมาทับ กระดาษ"])) return true;
  if (text.includes("โทรศัพท์") && matches(text, ["เอาไว้โทร", "โทรได้", "ห้าพันก็แพง", "แพงแล้ว"])) return true;
  if (matches(text, ["ตามสบาย.กูno", "กูno", "no! ใช้ของเดิม"])) return true;
  if (matches(text, ["กู้หนี้", "ยืมสิน", "ตกรุ่น", "ให้ดูดี", "ขอเปนกำลังใจ", "ขอเป็นกำลังใจ"])) return true;
  if (matches(text, ["เลิกใช้ iphone", "เลิกใช้แล้ว", "วันๆจะเปรี่ยน", "วันๆจะเปลี่ยน", "แม่งแต่โทรศัพท์"])) return true;
  return false;
}

function isProductCriticism(text) {
  if (matches(text, ["ไม่มีประโยชน์", "รำคาญ", "หัวจะปวด", "เกินไปจริงๆ", "แปง", "แพ๊ง"])) return true;
  if (text.includes("เครื่องละแสน") || text.includes("ราคาเริ่มต้นที่ 1 ล้าน")) return true;
  if (text.includes("ราคา") && matches(text, ["โคตรแรง", "แรงแต่", "ล้าน", "แรงมาก"])) return true;
  if (matches(text, ["โหดมาก", "การตลาดแบบบังคับ", "เศษเหล็ก", "เข็ดเลย", "ทำไมมันเพิ่มขึ้นเรื่อย"])) return true;
  return false;
}

function isShortNegativeText(text) {
  const compact = text.replace(/\s+/g, "");
  return ["แพง", "แปง", "แพ๊ง", "ไม่ซื้อ", "ไม่เอา"].includes(compact);
}

function isUncertainOrPracticalEvaluation(text) {
  return matches(text, [
    "ให้จริงหรอ",
    "ให้จริงเหรอ",
    "ขอได้ไหม",
    "คงจะไม่ได้",
    "คิดคำนวณ",
    "เหมาะกับการใช้ประโยชน์",
    "ราคาไหนเหมาะ",
    "ส่วนตัวนะ",
  ]);
}

function isDeviceProblemRequest(text) {
  return matches(text, [
    "เครื่องเก่า",
    "แบตเสื่อม",
    "เเบตเสื่อม",
    "หน้าจอแตก",
    "เครื่องก็ค้าง",
    "โทรศัพท์ก็ค้าง",
    "ทำงานตัดคลิป",
    "เครื่องนี้เริ่มไม่ไหว",
    "โทรศัพท์หนูเเตก",
  ]);
}

function buildSummary({ comments, posts, positive, neutral, negative, topTopics }) {
  const classified = positive + neutral + negative || 1;
  const positivePercent = Math.round((positive / classified) * 100);
  const negativePercent = Math.round((negative / classified) * 100);
  const topicText = topTopics
    .slice(0, 3)
    .map(([topic, count]) => `${topic} ${count} ข้อความ`)
    .join(", ");

  return `รายงานรอบลึกนี้ใช้ ${posts} โพสต์ TikTok และ ${comments.toLocaleString("th-TH")} คอมเมนต์เกี่ยวกับ iPhone 18 เพื่ออ่านเสียงตอบรับเบื้องต้น พบสัญญาณเชิงบวก ${positivePercent}% และเชิงลบ ${negativePercent}% จากกฎจัดประเภทอัตโนมัติ ประเด็นที่ถูกพูดถึงมากคือ ${topicText || "ยังไม่พบประเด็นเด่น"} โดยควรใช้ผลนี้เป็นร่างวิเคราะห์ก่อนตรวจทานขั้นสุดท้าย`;
}

function buildInsights(evidence, topicCounts, sentimentCounts, totalComments) {
  const comments = evidence.filter((item) => item.recordType === "comment");
  const topTopicEntries = [...topicCounts.entries()]
    .filter(([topic]) => !["ความคิดเห็นไทย", "ความคิดเห็นหลายภาษา"].includes(topic))
    .sort((a, b) => b[1] - a[1]);

  const priceEvidence = selectEvidence(comments, "ราคา/ความคุ้มค่า", 4);
  const buyingEvidence = selectEvidence(comments, "ตั้งใจซื้อ/รออัปเกรด", 4);
  const negativeEvidence = comments
    .filter((item) => item.sentiment === "negative")
    .sort((a, b) => (b.metrics?.likes || 0) - (a.metrics?.likes || 0))
    .slice(0, 4)
    .map((item) => item.id);

  const insights = [];

  insights.push({
    id: "insight-price",
    type: "concern",
    title: "ราคาคือแรงเสียดทานหลักของบทสนทนา",
    description: `พบข้อความเกี่ยวกับราคาและความคุ้มค่า ${topicCounts.get("ราคา/ความคุ้มค่า") || 0} รายการ หลายข้อความพูดถึงความแพง ราคาคาดการณ์ หรือเปรียบเทียบว่าคุ้มพอจะเปลี่ยนรุ่นหรือไม่`,
    evidenceIds: priceEvidence,
    recommendation:
      "แยกสื่อสารราคา โปรผ่อน และเหตุผลความคุ้มค่าของแต่ละรุ่นให้ชัด โดยเฉพาะรุ่นที่ถูกพูดถึงเรื่องราคาแรง",
  });

  insights.push({
    id: "insight-upgrade",
    type: "opportunity",
    title: "ยังมี demand จากกลุ่มรอซื้อและรออัปเกรด",
    description: `พบข้อความที่เข้าข่ายตั้งใจซื้อหรือรออัปเกรด ${topicCounts.get("ตั้งใจซื้อ/รออัปเกรด") || 0} รายการ สะท้อนว่ากระแส iPhone 18 ยังดึงความสนใจได้ แม้หลายคนรอข้อมูลจริงก่อนตัดสินใจ`,
    evidenceIds: buyingEvidence,
    recommendation:
      "เก็บกลุ่มรอซื้อไว้เป็น audience สำคัญ แล้วทดสอบข้อความเรื่องเหตุผลที่ควรอัปเกรดจาก iPhone 16/17",
  });

  insights.push({
    id: "insight-negative",
    type: "concern",
    title: "เสียงลบควรอ่านแยก ไม่ควรดูแค่สัดส่วนรวม",
    description: `ข้อความเชิงลบมี ${sentimentCounts.get("negative") || 0} รายการ หรือประมาณ ${Math.round(((sentimentCounts.get("negative") || 0) / totalComments) * 100)}% ของคอมเมนต์ทั้งหมด ส่วนใหญ่โยงกับราคา ความคุ้มค่า และความเชื่อถือของข่าวลือ`,
    evidenceIds: negativeEvidence,
    recommendation:
      "ตรวจทานตัวอย่างเสียงลบด้วยคนอีกครั้ง เพื่อแยก complaint จริงออกจากมุก ประชด และข้อความนอกประเด็น",
  });

  if (topTopicEntries[0]) {
    insights.push({
      id: "insight-topic-mix",
      type: "strength",
      title: "บทสนทนามีหลายมิติ ไม่ได้มีแค่ราคา",
      description: `นอกจากราคาแล้ว ยังพบประเด็น ${topTopicEntries
        .slice(1, 4)
        .map(([topic]) => topic)
        .join(", ")} ซึ่งช่วยบอกว่าคนกำลังประเมินทั้งการซื้อ รุ่นก่อนหน้า และข้อมูลเปิดตัว`,
      evidenceIds: topTopicEntries.flatMap(([topic]) => selectEvidence(comments, topic, 1)).slice(0, 4),
      recommendation:
        "ใช้ topic เหล่านี้จัดหน้า evidence และทำ section วิเคราะห์ย่อย เพื่อให้รายงานไม่สรุปกว้างเกินไป",
    });
  }

  return insights.filter((insight) => insight.evidenceIds.length > 0);
}

function selectEvidence(items, topic, limit) {
  return items
    .filter((item) => item.topics?.includes(topic))
    .sort((a, b) => (b.metrics?.likes || 0) - (a.metrics?.likes || 0))
    .slice(0, limit)
    .map((item) => item.id);
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--input") parsed.input = argv[++index];
  }
  return parsed;
}

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function containsThai(value) {
  return /[\u0E00-\u0E7F]/.test(value);
}

function isLowSignalText(text) {
  const compact = text.replace(/\s+/g, "");
  if (!compact) return true;
  if (compact.length <= 3) return true;
  if (/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\dM]+$/u.test(compact)) return true;
  if (/^\[[^\]]+\](\[[^\]]+\])*$/.test(compact)) return true;
  if (/^[@#]+$/.test(compact)) return true;
  return false;
}

function matches(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function countMatches(text, keywords) {
  return keywords.reduce((count, keyword) => count + (text.includes(keyword.toLowerCase()) ? 1 : 0), 0);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
