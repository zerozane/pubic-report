const positivePatterns = [
  /\b(?:love|loved|lovely|good|great|beautiful|pretty|nice|amazing|perfect|stunning|awesome|like|recommend(?:ed)?|not bad)\b/i,
  /\b(?:i want this|i needed it|i need this)\s+so bad\b/i,
  /(?:ดี|ดีมาก|ดีจริง|ดีเลย|ราคาดี|ใช้ดี|ติดทน|คุ้ม|จึ้ง|ปัง|เริ่ด|สวย|น่ารัก|ละมุน|ชอบ|รัก|อยากได้|อยากซื้อ|อยากให้ทำ|ต้องมี|ป้ายยา|ว้าว|ตาแตก|แสงพุ่ง|หลง|ใจฟู|ฟิน|รอซื้อ|รอเลย|รอสี|ทุกสี|เติมของ|กดด่วน|แนะนำ|ไปลอง|หน้าใส|ผิวดี|ใสมาก|เขียนง่าย|เขียนลื่น|ลื่น|นุ่ม|สีนี้ฮิต|สีจี๊ด|จี๊ดมาก|ขนลุก|ไม่เคยทำให้ผิดหวัง|ไม่ผิดหวัง|ไม่จกตา|ไม่เป็นคราบ|ไม่ตกร่อง)/i,
  /(?:เริ่ด|จึ้ง|สวย|ปัง|น่ารัก|ชอบ|ว้าว|ดีมาก).{0,16}ไม่ไหว/i,
  /ไม่ซื้อจะไหว|ไม่ซื้อไม่ไหว/i,
];

const negativePatterns = [
  /(?:ไม่ชอบ|ไม่ดี|ไม่คุ้ม|ไม่รอด|ไม่ติดทน|ติดไม่อยู่|หลุดง่าย|ผิดหวัง|แพงไป|แพงมาก|แพงเกิน|พัง|บ้ง|ตุ้บ|เฟล|ของปลอม|ปลอม.*(?:สินค้า|แบรนด์)|โป๊ะ|ส่งช้า|รั่ว|ระคายเคือง|แพ้(?:ง่าย|หนัก|เครื่องสำอาง|ครีม|ผิว|แล้ว|มาก)|แสบ(?:ผิว|หน้า|ตา|มาก|จริง)|คัน|เป็นคราบ|ตกร่อง|เหม็น|ห่วย|แย่|ไม่เอา|ไม่ซื้อ|ปัญหา|สิวขึ้น|ไม่มีประโยชน์)/i,
  /\b(?:not good|bad|hate|fake|broken|leak|late|disappoint(?:ed|ing)?|expensive|irritat(?:ed|ion)?|allerg(?:y|ic)|not worth)\b/i,
  /(?:ซื้อรถ|ซื้อมอเตอร์ไซค์|ซื้อวัว|ซื้อทอง|เอาเงินไป).{0,24}(?:ดีกว่า|คุ้มกว่า)/i,
  /(?:ไม่เอา|ไม่ซื้อ|เลิกใช้|รอรุ่นอื่น|รอไอโฟน(?:19|20)|รอ iphone (?:19|20))/i,
];

const neutralPatterns = [
  /(?:ราคาเท่าไหร่|ซื้อที่ไหน|สีอะไร|มีขายไหม|พิกัด|เมื่อไหร่|เข้าไทยวันไหน|ขอพิกัด|จริงไหม|จริงเหรอ|ได้ไหม|มั้ย|ไหม|หรือ)/i,
  /^(?:โอเค|เฉยๆ|ผ่าน|น่าลอง|ขอดู|ขอรีวิว|รีวิวหน่อย|สอบถาม|สนใจ)$/i,
];

const protectedPositivePatterns = [
  /\b(?:i needed it|i need this|i want this)\s+so bad\b/i,
  /\bnot bad\b/i,
  /ไม่ซื้อจะไหว|ไม่ซื้อไม่ไหว/i,
  /ไม่เคย(?:ทำให้)?ผิดหวัง|ไม่ผิดหวัง|ไมาผิดหวัง|ไม่จกตา|ไม่เป็นคราบ|ไม่ตกร่อง/i,
  /ไม่ขนลุกไม่เอา/i,
];

const defaultOffTopicPatterns = [
  /\b(?:hockey|habs|penguins|pens|matheson|dobson|carrier|hutson|reinbacher|playoff|penalt(?:y|ies)|dman|puck|goalie|nhl)\b/i,
];

export const sentimentStandardMethod =
  "จัด sentiment จากความหมายของข้อความเท่านั้น ไม่ใช้ likes/views/shares เป็นตัวตัดสิน: เชิงบวก = คำชม ความสนใจซื้อ หรือประสบการณ์ดี; เป็นกลาง = คำถาม ข้อมูลทั่วไป ข้อความสั้น อีโมจิ หรือข้อความที่ยังไม่มีทิศทางชัดเจน; เชิงลบ = คำร้องเรียน ความไม่พอใจ การปฏิเสธสินค้า หรือปัญหาจากการใช้งานที่ระบุชัดเจน";

export const modernSentimentLexicon = {
  positive: ["ดี", "ดีมาก", "สวย", "น่ารัก", "ชอบ", "อยากได้", "ต้องมี", "ปัง", "เริ่ด", "จึ้ง", "ใช้ดี", "ติดทน", "love", "great", "nice"],
  neutral: ["เฉยๆ", "น่าลอง", "ราคาเท่าไหร่", "ซื้อที่ไหน", "สีอะไร", "มีขายไหม", "พิกัด"],
  negative: ["ไม่ชอบ", "ไม่ดี", "ไม่คุ้ม", "ไม่รอด", "ผิดหวัง", "แพงเกิน", "พัง", "แพ้", "แสบ", "ระคายเคือง", "เป็นคราบ", "ปลอม", "ส่งช้า"],
};

export const modernSentimentContextRules = [];

export function classifySocialSentiment(text, options = {}) {
  const value = normalizeText(text);
  if (!value || isLowSignal(value)) return "neutral";

  const offTopicPatterns = options.offTopicPatterns || (options.domain === "laglace" ? defaultOffTopicPatterns : []);
  if (offTopicPatterns.some((pattern) => pattern.test(value))) return "neutral";

  if (protectedPositivePatterns.some((pattern) => pattern.test(value))) return "positive";
  if (/(?:อยากซื้อ|อยากได้).*(?:ต่างประเทศ|กดไม่ทัน|ของหมด)/i.test(value)) return "neutral";
  if (isContextualAdvice(value)) return "neutral";

  const negativeValue = value
    .replace(/ไม่เคยทำให้ผิดหวัง|ไม่ผิดหวัง|ไมาผิดหวัง|ไม่จกตา|ไม่เป็นคราบ|ไม่ตกร่อง/g, " ")
    .replace(/แพ้คของ/g, " ");
  const negativeHits = countMatches(negativeValue, negativePatterns);
  const positiveHits = countMatches(value, positivePatterns);
  const question = /[?？]|\b(?:ไหม|มั้ย|หรือ|เท่าไหร่|ที่ไหน|เมื่อไหร่|จริงเหรอ|จริงไหม)\b/i.test(value);

  if (negativeHits > 0) return "negative";
  if (question && positiveHits === 0) return "neutral";
  if (positiveHits > 0) return "positive";
  if (neutralPatterns.some((pattern) => pattern.test(value))) return "neutral";
  return "neutral";
}

export function classifyModernSentiment(text) {
  return classifySocialSentiment(text);
}

export function classifyLaGlaceSentiment(text) {
  return classifySocialSentiment(text, { domain: "laglace" });
}

function normalizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function isLowSignal(value) {
  const withoutMentions = value
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/@[\w.-]+/g, " ")
    .replace(/#[\wก-๙]+/g, " ")
    .replace(/[\p{Extended_Pictographic}\p{P}\p{S}\d\s]/gu, "");
  return withoutMentions.length === 0;
}

function isContextualAdvice(value) {
  return /(?:อาจจะเกิดจาก|ส่วนตัวเราเคย|แนะนำให้|เกิดจากสกินแคร์|ขาดความชุ่มชื้น)/i.test(value)
    && !/(?:ใช้แล้ว|ได้รับสินค้า|สินค้านี้|แบรนด์นี้|ผลิตภัณฑ์นี้).{0,20}(?:ไม่|แพ้|แสบ|คัน|เป็นคราบ|ตกร่อง)/i.test(value);
}

function countMatches(value, patterns) {
  return patterns.reduce((count, pattern) => count + (pattern.test(value) ? 1 : 0), 0);
}
