import fs from "node:fs";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(process.cwd(), String(args.input || "dataset_tiktok-reviews-scraper_2026.json"));
const normalizedPath = path.resolve(process.cwd(), String(args.output || "work/reviewed/laglace-product-reviews-normalized.json"));
const summaryPath = path.resolve(process.cwd(), String(args.summary || "data/reports/laglace-product-quality.json"));
const source = String(args.source || "tiktok").toLowerCase();

const productCatalog = {
  "1729588326432082832": { shortName: "บลัชดำ", category: "บลัช", label: "Baebie Vibes Cream Blush" },
  "1730014506458516368": { shortName: "ลิปไอติม", category: "ลิป", label: "Melted Sundae Lip Click" },
  "1731510000560081808": { shortName: "โทนเนอร์แพด", category: "โทนเนอร์แพด", label: "Daily Toner Pads" },
  "1729432254714448784": { shortName: "คอนซีลเลอร์", category: "คอนซีลเลอร์", label: "Airy Skin Concealer" },
  "1729605074994695056": { shortName: "อายไลเนอร์", category: "อายไลเนอร์", label: "2 in 1 Eyeliner & Remover Stick" },
  "1729605073949133712": { shortName: "ดอลลี่อาย", category: "ดอลลี่อาย", label: "Fiery Baby-Dolly Eye Stick" },
  "1735378019447768976": { shortName: "เจลลี่เซรั่มสเปรย์", category: "สกินแคร์", label: "First Serum in Mist Jelly Burst" },
  "1731970787293235088": { shortName: "มาสคาร่าคิ้ว", category: "คิ้ว", label: "Trailblazer Brow Mascara" },
  "1731525575167608720": { shortName: "คอเรคเตอร์", category: "เมคอัพงานผิว", label: "Corrector" },
  "1731191277169969040": { shortName: "ลิปแมท", category: "ลิป", label: "Ultimate Baddie Lip Matte" },
  "1732072766553361296": { shortName: "บลัชฝุ่นทูโทน", category: "บลัช", label: "Brattitude Two Tone Powder Blush" },
  "1734436642184595344": { shortName: "ลิปทินท์", category: "ลิป", label: "Flextopia Glassy Tint" },
};

const activeProductCatalog = source === "shopee"
  ? loadShopeeCatalog(args.catalog || "data/inputs/laglace-shopee-products.json")
  : productCatalog;

const topicRules = [
  { name: "สีและเฉดสี", pattern: /สี|เฉด|โทน|เบอร์|shade|color|colour|warm|cool/i },
  { name: "เนื้อสัมผัสและการเกลี่ย", pattern: /เนื้อ|สัมผัส|เกลี่ย|เบลนด์|blend|texture|บางเบา|นุ่ม|ฉ่ำ|แมตต์|แห้ง/i },
  { name: "ติดทนและกันน้ำ", pattern: /ติดทน|ทน|หลุด|กันน้ำ|กันเหงื่อ|แพนด้า|ตกร่อง|เลือน|lasting|waterproof|smudge/i },
  { name: "ผลลัพธ์การใช้งาน", pattern: /ปกปิด|ชุ่มชื้น|สิว|รูขุมขน|ผลลัพธ์|เห็นผล|อ่อนโยน|coverage|cover|hydration|glow/i },
  { name: "การระคายเคืองและผิวแพ้ง่าย", pattern: /แพ้|แสบ|คัน|ระคาย|สิวขึ้น|ผื่น|อักเสบ|sensitive|irritat/i },
  { name: "กลิ่น", pattern: /กลิ่น|หอม|เหม็น|scent|fragrance/i },
  { name: "แพ็กเกจและการใช้งาน", pattern: /แพ็ก|แพค|บรรจุ|กระปุก|เปิด|ปิด|พก|ใช้ง่าย|หัวปากกา|แพ็กเกจ/i },
  { name: "ราคาและความคุ้มค่า", pattern: /ราคา|คุ้ม|บาท|ลด|โปร|แถม|คุ้มค่า|worth|cheap/i },
  { name: "การจัดส่งและร้านค้า", pattern: /ส่ง|ขนส่ง|พัสดุ|กล่อง|ร้าน|บริการ|ช้า|เร็ว|แตก|บุบ/i },
];

const issuePattern = /ไม่(?:ค่อย|ค่อยจะ)?(?:ติดทน|ปกปิด|ชุ่มชื้น|กันน้ำ|กันเหงื่อ|เนียน|คุ้ม|หอม)|ไม่ชอบ(?:เลย|มาก|สินค้า|สี|เนื้อ|เท่าไหร่)|หลุด(?:ง่าย|เร็ว)?|แพ้(?!ค|ก)|แสบ|คัน|ระคาย|สิวขึ้น|ผื่น|อักเสบ|ตกร่อง|แพนด้า|เลือน|ดรอป|เยิ้ม|พัง|เสีย|แตก(?!ต่าง|แตน)|บุบ|ช้า|เหม็น/i;

const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
if (!Array.isArray(raw)) throw new Error("Input must be a JSON array");
const reviewRows = source === "shopee" ? raw.filter(isShopeeReview) : raw;

const normalized = reviewRows.map((item, index) => normalizeReview(item, index));
const summary = buildSummary(normalized);

writeJson(normalizedPath, normalized);
writeJson(summaryPath, summary);

console.log(`Normalized ${normalized.length} product reviews`);
console.log(`Wrote reviews: ${path.relative(process.cwd(), normalizedPath)}`);
console.log(`Wrote quality summary: ${path.relative(process.cwd(), summaryPath)}`);

function normalizeReview(item, index) {
  const productId = source === "shopee"
    ? String(item.itemId || item.item_id || item.itemid || "unknown")
    : String(item.product_id || "unknown");
  const catalog = source === "shopee" ? getShopeeCatalog(item, productId) : activeProductCatalog[productId] || { shortName: "ไม่ระบุสินค้า", category: "ไม่ระบุประเภท", label: "ไม่ระบุรุ่น", url: null, shopId: null };
  const text = cleanText(source === "shopee" ? item.comment || item.review_text || item.reviewText : item.review_text);
  const templateTopics = source === "shopee" ? mapShopeeTemplateTags(item.templateTags) : [];
  const qualityTopics = unique([...topicRules.filter((rule) => rule.pattern.test(text)).map((rule) => rule.name), ...templateTopics]);
  const experienceType = getExperienceType(text, qualityTopics);
  const ratingValue = source === "shopee" ? item.ratingStar ?? item.rating_star ?? item.rating : item.review_rating;
  const rating = Number(ratingValue) || null;
  const sentiment = rating === null ? "neutral" : rating === 5 ? "positive" : rating >= 3 ? "neutral" : "negative";
  const issueText = text.replace(/(?:ไม่|ไม่ได้|ยังไม่|ไม่มี)\s*(?:เสียหาย|แตก|บุบ|พัง|แพ้(?:กัน|เลย)?)/gi, "");
  const qualityIssues = issuePattern.test(issueText) && qualityTopics.length
    ? qualityTopics.filter((topic) => topic !== "การจัดส่งและร้านค้า" || /ส่ง|ขนส่ง|พัสดุ|กล่อง|ร้าน|บริการ|ช้า|เร็ว|แตก|บุบ/i.test(text))
    : [];

  return {
    id: String(source === "shopee" ? item.reviewId || item.review_id || item.cmtid || `${productId}-${index + 1}` : item.review_id || `${productId}-${index + 1}`),
    productId,
    productName: catalog.shortName,
    sourceName: getProductTitle(item.product_name || item.productName, catalog.label),
    productLabel: catalog.label,
    productCategory: catalog.category,
    sku: source === "shopee" ? getShopeeVariations(item.variations, item.model_name) : item.sku_specification || null,
    rating,
    sentiment,
    reviewText: text,
    reviewCountry: source === "shopee" ? item.region || item.country || null : item.review_country || null,
    verifiedPurchase: source === "shopee" ? Boolean(item.isVerifiedPurchase || item.verifiedPurchase) : Boolean(item.is_verified_purchase),
    incentivizedReview: source === "shopee" ? false : Boolean(item.is_incentivized_review),
    reviewTime: source === "shopee"
      ? normalizeDateValue(item.createdAt || item.review_date || (item.ctime ? Number(item.ctime) * 1000 : null))
      : item.review_time ? new Date(Number(item.review_time)).toISOString() : null,
    productUrl: source === "shopee" ? item.product_url || catalog.url || buildShopeeUrl(item, catalog) : item.product_url || null,
    detailedRating: source === "shopee" ? item.detailedRating || item.detailed_rating || null : null,
    sellerReply: source === "shopee" ? item.shopReply || item.seller_reply || null : null,
    media: source === "shopee" ? { images: item.images || [], imageCount: item.image_count || 0, videoCount: item.video_count || 0 } : null,
    qualityTopics,
    qualityIssues,
    experienceType,
    isIssue: qualityIssues.length > 0,
    needsHumanReview: needsHumanReview(text, qualityTopics),
  };
}

function buildSummary(records) {
  const catalogs = new Map(Object.entries(activeProductCatalog));
  for (const record of records) {
    if (!catalogs.has(record.productId)) {
      catalogs.set(record.productId, {
        shortName: record.productName,
        category: record.productCategory,
        label: record.sourceName,
        url: record.productUrl,
      });
    }
  }
  const products = Array.from(catalogs.values()).map((catalog) => {
    const rows = records.filter((record) => record.productName === catalog.shortName);
    return buildProductSummary(catalog, rows);
  }).filter((product) => product.count > 0);

  const topics = summarizeTopics(records);
  const issues = records.filter((record) => record.isIssue);
  const ratings = records.filter((record) => record.rating !== null);
  const ratingTotal = ratings.reduce((total, record) => total + record.rating, 0);
  const evidence = selectEvidence(records);

  return {
    version: 1,
    brand: "LA GLACE",
    source: {
      platform: source === "shopee" ? "Shopee" : "TikTok Shop",
      region: "TH",
      inputFile: path.basename(inputPath),
      collectedAt: new Date().toISOString(),
    },
    totals: {
      reviews: records.length,
      averageRating: ratings.length ? Number((ratingTotal / ratings.length).toFixed(2)) : null,
      fiveStarReviews: ratings.filter((record) => record.rating === 5).length,
      lowRatingReviews: ratings.filter((record) => record.rating <= 2).length,
      verifiedPurchases: records.filter((record) => record.verifiedPurchase).length,
      thaiReviews: records.filter((record) => record.reviewCountry === "TH").length,
      issueReviews: issues.length,
      humanReview: records.filter((record) => record.needsHumanReview).length,
    },
    products,
    topics,
    evidence,
    methodology: {
      qualityTopics: "จับหัวข้อจากคำที่ปรากฏในข้อความรีวิวจริง ไม่สร้างหัวข้อจากคะแนนเพียงอย่างเดียว",
      sentiment: "ใช้คะแนนรีวิวเป็นเกณฑ์ sentiment: 5 ดาว = เชิงบวก, 3–4 ดาว = เป็นกลาง, 1–2 ดาว = เชิงลบ; ปัญหาคุณภาพต้องดูจากข้อความรีวิวและ qualityIssues แยกต่างหาก",
      limitations: [
        source === "shopee"
          ? "Shopee Shop Reviews Actor จำกัดประมาณ 1,000 รีวิวต่อระดับดาว และประมาณ 5,000 รีวิวต่อร้าน; ผลลัพธ์เป็น snapshot ของช่วงที่เก็บ"
          : "รีวิว 1,000 รายการต่อสินค้าเป็น sample ที่เรียงตาม most recent",
        "รีวิวที่พูดถึงบริการร้านค้า/การจัดส่งถูกแยกจากคุณภาพตัวสินค้า",
        "ข้อความสั้นหรือข้อความที่จับหัวข้อไม่ได้ควรตรวจโดยคนก่อนใช้เป็น insight",
      ],
    },
  };
}

function buildProductSummary(catalog, rows) {
  const ratings = rows.filter((record) => record.rating !== null);
  const topicMap = new Map();
  for (const row of rows) {
    for (const topic of row.qualityTopics) topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
  }
  const topics = Array.from(topicMap.entries())
    .sort(([, left], [, right]) => right - left)
    .map(([name, count]) => ({ name, count, percent: Math.round((count / Math.max(rows.length, 1)) * 100) }));
  const issueRows = rows.filter((row) => row.isIssue);

  return {
    id: Object.entries(activeProductCatalog).find(([, value]) => value.shortName === catalog.shortName)?.[0] || catalog.shortName,
    name: catalog.shortName,
    sourceName: rows[0]?.sourceName || catalog.label,
    label: catalog.label,
    category: catalog.category,
    count: rows.length,
    averageRating: ratings.length ? Number((ratings.reduce((sum, row) => sum + row.rating, 0) / ratings.length).toFixed(2)) : null,
    fiveStarPercent: percent(ratings.filter((row) => row.rating === 5).length, ratings.length),
    lowRatingPercent: percent(ratings.filter((row) => row.rating <= 2).length, ratings.length),
    verifiedPercent: percent(rows.filter((row) => row.verifiedPurchase).length, rows.length),
    ratingDistribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: rows.filter((row) => row.rating === rating).length })),
    issueCount: issueRows.length,
    topics: topics.slice(0, 6),
  };
}

function summarizeTopics(records) {
  const map = new Map();
  for (const record of records) {
    for (const topic of record.qualityTopics) {
      const current = map.get(topic) || { name: topic, count: 0, negative: 0, products: new Set() };
      current.count += 1;
      if (record.isIssue) current.negative += 1;
      current.products.add(record.productName);
      map.set(topic, current);
    }
  }
  const rows = Array.from(map.values()).sort((left, right) => right.count - left.count);
  const max = rows[0]?.count || 1;
  return rows.map((row) => ({ ...row, percent: Math.round((row.count / max) * 100), products: Array.from(row.products) }));
}

function selectEvidence(records) {
  const selected = [];
  const productNames = unique([
    ...Object.values(activeProductCatalog).map((product) => product.shortName),
    ...records.map((record) => record.productName),
  ]);
  for (const productName of productNames) {
    const rows = records.filter((record) => record.productName === productName && record.reviewText);
    const negative = rows.filter((record) => record.isIssue).sort((left, right) => (left.rating || 5) - (right.rating || 5) || right.reviewText.length - left.reviewText.length)[0];
    const positive = rows.filter((record) => !record.isIssue && record.qualityTopics.length).sort((left, right) => right.reviewText.length - left.reviewText.length)[0];
    for (const row of [negative, positive]) {
      if (!row || selected.some((item) => item.id === row.id)) continue;
      selected.push({
        id: row.id,
        productId: row.productId,
        productName: row.sourceName,
        category: row.productCategory,
        text: row.reviewText,
        rating: row.rating,
        sku: row.sku,
        sentiment: row.sentiment,
        topics: row.qualityTopics,
        issues: row.qualityIssues,
        verifiedPurchase: row.verifiedPurchase,
        reviewCountry: row.reviewCountry,
        productUrl: row.productUrl,
      });
    }
  }
  return selected;
}

function getExperienceType(text, topics) {
  if (text.trim().length < 8 || (!/[ก-๙a-z]/i.test(text) && !topics.length)) return "ข้อความสั้น/ข้อมูลไม่เพียงพอ";
  if (topics.includes("การจัดส่งและร้านค้า") && topics.length === 1) return "การจัดส่งและร้านค้า";
  return "ประสบการณ์ใช้สินค้า";
}

function needsHumanReview(text, topics) {
  return text.trim().length < 8 || (!topics.length && text.trim().length < 24);
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function loadShopeeCatalog(catalogPath) {
  const fullPath = path.resolve(process.cwd(), String(catalogPath));
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Shopee catalog not found: ${fullPath}. Create it from data/inputs/laglace-shopee-products.example.json.`);
  }
  const rows = JSON.parse(fs.readFileSync(fullPath, "utf8").replace(/^\uFEFF/, ""));
  if (!Array.isArray(rows) || !rows.length) throw new Error("Shopee catalog must be a non-empty JSON array.");

  return Object.fromEntries(rows.map((row) => {
    const match = String(row.url || "").match(/-i\.(\d+)\.(\d+)/i);
    if (!match) throw new Error(`Invalid Shopee product URL in catalog: ${row.url || "(missing)"}`);
    const [, shopId, itemId] = match;
    return [itemId, {
      shortName: cleanText(row.name || row.shortName || row.label || `สินค้า ${itemId}`),
      category: cleanText(row.category || "ไม่ระบุประเภท"),
      label: cleanText(row.label || row.name || `สินค้า ${itemId}`),
      url: String(row.url),
      shopId,
    }];
  }));
}

function getShopeeCatalog(item, productId) {
  if (activeProductCatalog[productId]) return activeProductCatalog[productId];
  const sourceName = getProductTitle(item.product_name || item.productName, `สินค้า ${productId}`);
  return {
    shortName: sourceName,
    category: inferProductCategory(sourceName),
    label: sourceName,
    url: item.product_url || null,
    shopId: item.shopid || item.shopId || null,
  };
}

function inferProductCategory(name) {
  const value = String(name).toLowerCase();
  if (/lip|ลิป|tint|sundae|click/.test(value)) return "ลิป";
  if (/blush|บลัช|บรัช/.test(value)) return "บลัช";
  if (/toner|โทนเนอร์/.test(value)) return "โทนเนอร์แพด";
  if (/concealer|คอนซีล/.test(value)) return "คอนซีลเลอร์";
  if (/eyeliner|อายไลเนอร์/.test(value)) return "อายไลเนอร์";
  if (/dolly|ดอลลี่/.test(value)) return "ดอลลี่อาย";
  if (/mascara|มาสคาร่า|brow|คิ้ว/.test(value)) return "คิ้ว";
  return "ไม่ระบุประเภท";
}

function isShopeeReview(item) {
  if (!item || item.type === "shop" || item.type === "summary") return false;
  return item.type === undefined || item.type === "review" || item.ratingStar !== undefined || item.rating_star !== undefined || item.cmtid !== undefined;
}

function mapShopeeTemplateTags(tags) {
  const map = new Map([
    ["product quality", "คุณภาพสินค้า"],
    ["packaging", "แพ็กเกจและการใช้งาน"],
    ["value for money", "ราคาและความคุ้มค่า"],
    ["seller service", "การจัดส่งและร้านค้า"],
    ["delivery", "การจัดส่งและร้านค้า"],
    ["delivery service", "การจัดส่งและร้านค้า"],
  ]);
  return (Array.isArray(tags) ? tags : [])
    .map((tag) => map.get(String(tag).trim().toLowerCase()))
    .filter(Boolean);
}

function getShopeeVariations(variations, modelName = null) {
  if (!Array.isArray(variations)) return cleanText(modelName) || null;
  const value = variations
    .map((variation) => {
      const name = cleanText(variation?.name);
      const options = Array.isArray(variation?.options) ? variation.options.map(cleanText).filter(Boolean).join(", ") : "";
      return name && options ? `${name}: ${options}` : name || options;
    })
    .filter(Boolean)
    .join(" · ");
  return value || null;
}

function buildShopeeUrl(item, catalog) {
  const shopId = item.shopId || item.shop_id || item.shopid || catalog.shopId;
  const itemId = item.itemId || item.item_id || item.itemid;
  if (!shopId || !itemId) return null;
  const hostByRegion = { TH: "shopee.co.th", SG: "shopee.sg", MY: "shopee.com.my", ID: "shopee.co.id", VN: "shopee.vn", PH: "shopee.ph", BR: "shopee.com.br", TW: "shopee.tw" };
  return `https://${hostByRegion[String(item.region || "TH").toUpperCase()] || "shopee.co.th"}/product-i.${shopId}.${itemId}`;
}

function normalizeDateValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = new Date(typeof value === "number" ? value : String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function unique(values) {
  return Array.from(new Set(values));
}

function getProductTitle(value, fallback) {
  const title = cleanText(value).split("|")[0].replace(/^\([^)]*\)\s*/, "").trim();
  return title || fallback;
}

function percent(value, total) {
  return total ? Number(((value / total) * 100).toFixed(1)) : 0;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function parseArgs(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) continue;
    result[value.slice(2)] = values[index + 1] && !values[index + 1].startsWith("--") ? values[++index] : true;
  }
  return result;
}
