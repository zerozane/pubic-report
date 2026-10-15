import fs from "node:fs";
import path from "node:path";
import { classifyLaGlaceSentiment, sentimentStandardMethod } from "./sentiment-rules.mjs";

const outPath = "data/reports/laglace-clean-social-report.json";
const palette = ["#FB6F92", "#62D6A3", "#9B7CFF", "#F6C85F", "#73B7FF", "#F28C8C", "#7ED6D1", "#B8A1FF"];
const period = {
  from: "2026-07-08T00:00:00.000+07:00",
  to: "2026-10-08T23:59:59.999+07:00",
  timezone: "Asia/Bangkok"
};

const sources = [
  { platform: "TikTok", files: ["work/raw/tiktok-comments-topup-existing-1000-official-clean.json", "work/raw/tiktok-comments-500-sd_muzmq66hkdrz4zqcz.json"] },
  { platform: "Instagram", files: ["work/raw/instagram-comments-500-sd_muzmq7tk36eh9maaa.json", "work/raw/instagram-comments-topup-500-sd_muzmymedk4dfl1rpc.json"] },
  { platform: "Facebook", files: ["work/raw/facebook-comments-500-sd_muzmq9en28slyftp4t.json", "work/raw/facebook-comments-topup-500-sd_muzmyoeqxfdk70qnu.json", "work/raw/facebook-comments-3mo-from-posts-sd_muzp52vikbf0xc0ut.json"] },
  { platform: "YouTube", files: ["work/raw/youtube-comments-500-sd_muzncelr17g2cmw6bc.json"] },
  { platform: "X", files: ["work/raw/laglace-x-replies-smoke.json", "work/raw/x-replies-test-10-apify.json", "work/raw/x-replies-test-10-apify-multi.json", "work/raw/x-replies-batch1-chunk1-apify.json", "work/raw/x-replies-batch1-chunk2-apify.json", "work/raw/x-replies-batch1-chunk3-apify.json", "work/raw/x-replies-batch1-chunk4-apify.json", "work/raw/x-replies-batch1-chunk5-apify.json", "work/raw/x-replies-batch2-smallchunk1-apify.json"] }
];

const evidence = [];
const seen = new Set();
for (const source of sources) {
  for (const file of source.files) {
    if (!fs.existsSync(file)) continue;
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    if (raw?.status) continue;
    const rows = Array.isArray(raw) ? raw : [raw];
    for (const [index, row] of rows.entries()) {
      const item = toEvidence(row, source.platform, index);
      if (!item.text && !item.sourceUrl) continue;
      const key = `${item.platform}:${item.sourceId || item.sourceUrl || item.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      evidence.push(item);
    }
  }
}

if (!evidence.length && fs.existsSync(outPath)) {
  const existingReport = JSON.parse(fs.readFileSync(outPath, "utf8"));
  for (const item of existingReport.evidence || []) {
    if (!item.text && !item.sourceUrl) continue;
    const sentiment = classifyLaGlaceSentiment(item.text);
    evidence.push({ ...item, sentiment, isIssue: sentiment === "negative" });
  }
}

evidence.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
const counts = countBy(evidence, (item) => item.platform);
const sentimentCounts = countBy(evidence, (item) => item.sentiment || "unclassified");
const topics = buildTopicCounts(evidence);
const timeline = buildTimeline(evidence);
const insights = buildInsights(evidence, topics);

const report = {
  slug: "laglace-clean-social-report",
  title: "La Glace Clean Social Listening Report",
  status: "draft",
  author: "Natth",
  period,
  collectedAt: new Date().toISOString(),
  summary: `Clean social listening dataset for La Glace using verified/keyword-matched public comments. Current dataset contains ${evidence.length.toLocaleString("en-US")} records, led by TikTok official videos and supported by Instagram, X, Facebook, and YouTube samples.`,
  methodology: {
    source: "Bright Data TikTok official video comments, Instagram comments, Facebook comments, YouTube comments, and Apify X replies. TikTok excludes unrelated 14k mixed scrape records and keeps only @laglace_official/keyword-matched sources.",
    selection: "Includes only records with auditable source URLs or source IDs from the collected clean files. The TikTok bulk scrape was filtered at source-video level to official La Glace videos before inclusion.",
    sentimentMethod: "จัด sentiment จากความหมายข้อความเท่านั้น ไม่ใช้ likes/views เป็นตัวตัดสิน: เชิงบวก = คำชม ประสบการณ์ดี ความต้องการซื้อ หรือการแนะนำ; เป็นกลาง = คำถาม ขอสี/ราคา/พิกัด ข้อความสั้น อีโมจิ หรือข้อความนอกประเด็น; เชิงลบ = ร้องเรียน ไม่พอใจ หรือปัญหาจากการใช้สินค้าที่ระบุชัดเจน",
    sentimentMethod: sentimentStandardMethod,
    limitations: [
      "TikTok has much larger coverage than other platforms because official TikTok source videos produced the highest available comment volume.",
      "Facebook and YouTube remain limited samples because discovered source posts/videos had low visible comment volume.",
      "X collection stopped at the available Apify quota, so X should be interpreted as a sample rather than full-platform coverage.",
      "Automated sentiment and topic labels should be reviewed before final publishing, especially for slang, sarcasm, and emoji-only messages."
    ]
  },
  insights,
  evidence,
  dashboard: {
    eyebrow: "Clean Social Listening Dataset",
    headline: "LA GLACE social listening clean report",
    description: `Cleaned public conversation dataset with ${evidence.length.toLocaleString("en-US")} auditable records. TikTok official comments are the core signal; other platforms provide supporting samples for channel context.`,
    brandMark: "LG",
    brandName: "LA GLACE",
    badge: "Jul-Oct 2026 clean cut",
    kpis: [
      { label: "Clean records", value: formatNumber(evidence.length), caption: "Auditable comments after source filtering", badge: "Clean", tone: "pink" },
      { label: "Positive sentiment", value: `${percent(sentimentCounts.positive || 0, classifiedCount(evidence))}%`, caption: `${formatNumber(classifiedCount(evidence))} classified records`, badge: "Text-based", tone: "mint" },
      { label: "TikTok official comments", value: formatNumber(counts.TikTok || 0), caption: "Core source after removing unrelated scrape", badge: "Primary", tone: "pink" },
      { label: "Supporting platforms", value: formatNumber((counts.Instagram || 0) + (counts.Facebook || 0) + (counts.YouTube || 0) + (counts.X || 0)), caption: "Instagram, Facebook, YouTube, X", badge: "Context", tone: "slate" }
    ],
    ingestion: {
      statusText: "Clean dataset prepared",
      window: "8 Jul - 8 Oct 2026",
      pipelineSpeed: "Manual QA + scraper exports",
      dataFreshness: new Date().toISOString().slice(0, 10),
      monitoredKeywords: ["La Glace", "laglace", "Melted Sundae", "@laglace_official", "official TikTok", "public comments"],
      connectedSources: [
        source("TikTok Official Comments", "Official video comments", "TikTok", counts.TikTok || 0, "Connected"),
        source("Instagram Comments", "Post comments", "Instagram", counts.Instagram || 0, "Connected"),
        source("Facebook Comments", "Page/post comments", "Facebook", counts.Facebook || 0, "Limited sample"),
        source("YouTube Comments", "Review/video comments", "YouTube", counts.YouTube || 0, "Limited sample"),
        source("X Replies", "Apify reply sample", "X", counts.X || 0, "Quota-limited")
      ],
      topKeywords: topics.slice(0, 8).map((topic, index) => ({ tag: topic.name, count: topic.count, percentage: percent(topic.count, evidence.length), color: palette[index % palette.length] }))
    },
    timeline,
    pillars: topics.slice(0, 4).map((topic) => ({
      title: topic.name,
      share: percent(topic.count, evidence.length),
      positive: percent(topic.positive, Math.max(topic.count, 1)),
      description: `${formatNumber(topic.count)} records in this topic from the clean dataset`,
      keywords: topic.keywords,
      takeaway: topic.takeaway
    }))
  }
};

fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outPath, records: evidence.length, platforms: counts, sentiment: sentimentCounts }, null, 2));

function toEvidence(row, platform, index) {
  const text = pick(row, textKeys(platform));
  const sourceId = String(pick(row, idKeys(platform)) || `${platform.toLowerCase()}-${index + 1}`);
  const sourceUrl = normalizeUrl(pick(row, urlKeys(platform)), row, platform);
  const publishedAt = normalizeDate(pick(row, dateKeys(platform)) || row.timestamp || new Date().toISOString());
  const sentiment = classifyLaGlaceSentiment(text);
  const topics = classifyTopics(text, row, platform);
  const metrics = metricsFor(row, platform);
  return {
    id: uniqueId(`${platform.toLowerCase()}-${sourceId}`),
    platform,
    recordType: "comment",
    sourceId,
    parentPostId: nullable(pick(row, parentKeys(platform))),
    sourceUrl,
    publishedAt,
    text: text || "",
    sentiment,
    topics,
    metrics,
    isDemo: false,
    user: pick(row, userKeys(platform)) || undefined,
    authorName: pick(row, authorKeys(platform)) || undefined,
    matchedKeywords: matchedKeywords(text, row, platform),
    engagement: Object.values(metrics).reduce((sum, value) => sum + (Number(value) || 0), 0),
    isIssue: sentiment === "negative"
  };
}

function textKeys(platform) {
  return platform === "Instagram" ? ["comment", "caption", "description"]
    : platform === "Facebook" ? ["comment_text", "text", "content"]
    : platform === "YouTube" ? ["comment_text", "text"]
    : platform === "X" ? ["text", "full_text", "replyText", "body"]
    : ["comment_text", "text", "description", "caption"];
}
function idKeys(platform) { return platform === "X" ? ["tweet_id", "id", "id_str", "rest_id"] : ["comment_id", "id", "sourceId"]; }
function urlKeys(platform) { return platform === "X" ? ["url", "tweetUrl", "replyUrl", "link"] : ["comment_url", "comment_link", "url", "post_url", "sourceUrl"]; }
function parentKeys(platform) { return platform === "YouTube" ? ["video_id"] : platform === "X" ? ["conversation_id", "in_reply_to_status_id_str"] : ["post_id", "video_id", "parentPostId"]; }
function dateKeys(platform) { return platform === "Instagram" ? ["comment_date", "date", "timestamp"] : platform === "Facebook" ? ["date_created", "date", "timestamp"] : platform === "YouTube" ? ["date_iso", "date", "timestamp"] : platform === "X" ? ["created_at", "createdAt", "date", "timestamp"] : ["date_created", "comment_date", "created_at", "timestamp"]; }
function userKeys(platform) { return platform === "Instagram" ? ["comment_user"] : platform === "Facebook" ? ["user_name"] : platform === "YouTube" ? ["username"] : platform === "X" ? ["screen_name", "username", "author.userName"] : ["commenter_user_name", "username", "user_name"]; }
function authorKeys(platform) { return platform === "X" ? ["authorName", "user_info.name", "name"] : ["authorName", "user_name", "username"]; }

function metricsFor(row, platform) {
  return {
    likes: numberLike(pick(row, ["num_likes", "likes", "likes_number", "favorites", "favorite_count"])),
    replies: numberLike(pick(row, ["num_replies", "replies", "replies_number", "replyCount"])),
    shares: numberLike(pick(row, ["shares", "retweets", "retweetCount", "num_shares"])),
    views: numberLike(pick(row, ["views", "viewCount", "video_view_count", "play_count"]))
  };
}

function classifyTopics(text, row, platform) {
  const value = `${text || ""} ${pick(row, ["url", "post_url"]) || ""}`.toLowerCase();
  const topics = [];
  if (/lip|sundae|melted|shade|color|colour|gloss|mascara|brow|official/.test(value)) topics.push("Product shades & lip products");
  if (/buy|price|shop|order|stock|available|sold|promo|link|where/.test(value)) topics.push("Purchase intent & availability");
  if (/love|cute|good|great|beautiful|pretty|nice|want|need|wow|like/.test(value)) topics.push("Positive reactions & praise");
  if (/review|try|use|wear|texture|quality|pack|lasting|swatch/.test(value)) topics.push("Review & product experience");
  if (/fake|expensive|broken|leak|late|bad|allergy|irritat|issue|problem|out of stock/.test(value)) topics.push("Concerns & issues");
  if (platform === "TikTok" && /@laglace_official/.test(value)) topics.push("Official TikTok conversation");
  if (!topics.length) topics.push(`${platform} audience reaction`);
  return [...new Set(topics)];
}
function fallbackSentiment(text) {
  const value = String(text || "").toLowerCase();
  if (!value.trim()) return "neutral";
  if (/fake|expensive|broken|leak|late|bad|allergy|irritat|disappoint|issue|problem|hate/.test(value)) return "negative";
  if (/love|cute|good|great|beautiful|pretty|nice|want|need|wow|like|perfect|amazing/.test(value)) return "positive";
  return "neutral";
}
function matchedKeywords(text, row, platform) {
  const value = `${text || ""} ${pick(row, ["url", "post_url"]) || ""}`.toLowerCase();
  const hits = [
    [/la\s*glace/i, "La Glace"],
    [/laglace/i, "laglace"],
    [/melted\s*sundae/i, "Melted Sundae"],
    [/lip/i, "lip"],
    [/mascara/i, "mascara"]
  ].filter(([rx]) => rx.test(value)).map(([, label]) => label);
  if (platform === "TikTok" && /@laglace_official/.test(value)) hits.push("@laglace_official");
  return [...new Set(hits)];
}
function buildTopicCounts(items) {
  const map = new Map();
  for (const item of items) {
    for (const topic of item.topics) {
      const current = map.get(topic) || { name: topic, count: 0, positive: 0, keywords: [], takeaway: "" };
      current.count++;
      if (item.sentiment === "positive") current.positive++;
      map.set(topic, current);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count).map((topic) => ({
    ...topic,
    keywords: topicKeywords(topic.name),
    takeaway: topicTakeaway(topic.name)
  }));
}

function buildTimeline(items) {
  const map = new Map();
  for (const item of items) {
    const day = item.publishedAt.slice(0, 10);
    const current = map.get(day) || { total: 0, positive: 0, negative: 0 };
    current.total++;
    if (item.sentiment === "positive") current.positive++;
    if (item.sentiment === "negative") current.negative++;
    map.set(day, current);
  }
  const entries = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  const sampled = sample(entries, 14);
  const peak = entries.length ? entries.reduce((best, current) => current[1].total > best[1].total ? current : best, entries[0]) : null;
  return {
    labels: sampled.map(([day]) => day.slice(5)),
    total: sampled.map(([, data]) => data.total),
    positive: sampled.map(([, data]) => data.positive),
    negative: sampled.map(([, data]) => data.negative),
    events: peak ? [{ index: Math.max(0, sampled.findIndex(([day]) => day === peak[0])), label: `Peak ${peak[0]}`, description: `${formatNumber(peak[1].total)} records in the clean dataset`, color: "#FB6F92" }] : []
  };
}

function buildInsights(items, topics) {
  const positive = items.filter((item) => item.sentiment === "positive");
  const negative = items.filter((item) => item.sentiment === "negative");
  const intent = items.filter((item) => item.topics.includes("Purchase intent & availability"));
  return [
    insight("clean-tiktok-official-scale", "strength", "TikTok official videos provide the strongest clean signal", `The clean report includes ${formatNumber(items.filter((item) => item.platform === "TikTok").length)} TikTok records after filtering to official/keyword-matched videos.`, positive.slice(0, 8), "Use TikTok comments as the main evidence base, but label other channels as supporting samples."),
    insight("purchase-intent-availability", "opportunity", "Purchase intent and availability questions are a clear conversion opportunity", `${formatNumber(intent.length)} records mention purchase intent, price, stock, shades, or where-to-buy signals.`, intent.slice(0, 8), "Turn recurring shade, stock, and purchase questions into pinned FAQ, reply templates, and commerce links."),
    insight("limited-cross-platform-samples", "concern", "Cross-platform comparison should be presented carefully", `Non-TikTok platforms are smaller samples: Instagram ${formatNumber(items.filter((i) => i.platform === "Instagram").length)}, X ${formatNumber(items.filter((i) => i.platform === "X").length)}, Facebook ${formatNumber(items.filter((i) => i.platform === "Facebook").length)}, YouTube ${formatNumber(items.filter((i) => i.platform === "YouTube").length)}.`, negative.slice(0, 8), "Frame the dashboard as a clean evidence explorer, not a complete market share comparison across platforms.")
  ];
}

function insight(id, type, title, description, evidenceRows, recommendation) {
  return { id, type, title, description, evidenceIds: evidenceRows.map((item) => item.id), recommendation };
}

function pick(row, keys) {
  for (const key of keys) {
    const value = key.split(".").reduce((acc, part) => acc && acc[part], row);
    if (value !== undefined && value !== null && value !== "") return String(value).trim();
  }
  return "";
}
function normalizeUrl(value, row, platform) {
  if (value) return String(value).replace("twitter.com", "x.com");
  if (platform === "X") {
    const id = pick(row, ["tweet_id", "id", "id_str", "rest_id"]);
    const user = pick(row, ["screen_name", "username", "author.userName"]);
    if (id && user) return `https://x.com/${user}/status/${id}`;
    if (id) return `https://x.com/i/web/status/${id}`;
  }
  return null;
}
function normalizeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}
function uniqueId(value) { return value.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").slice(0, 96); }
function nullable(value) { return value || null; }
function numberLike(value) { const n = Number(String(value || "").replace(/,/g, "")); return Number.isFinite(n) ? n : null; }
function countBy(items, fn) { return items.reduce((acc, item) => { const key = fn(item); acc[key] = (acc[key] || 0) + 1; return acc; }, {}); }
function classifiedCount(items) { return items.filter((item) => item.sentiment).length; }
function percent(value, total) { return total ? Math.round((value / total) * 100) : 0; }
function formatNumber(value) { return Math.round(value).toLocaleString("en-US"); }
function source(name, type, platform, count, status) { return { name, type, status, count: `${formatNumber(count)} records`, platform }; }
function sample(entries, max) { if (entries.length <= max) return entries; const step = (entries.length - 1) / (max - 1); return Array.from({ length: max }, (_, index) => entries[Math.round(index * step)]); }
function topicKeywords(name) {
  if (name.includes("Purchase")) return ["buy", "price", "stock", "shop"];
  if (name.includes("Product")) return ["shade", "lip", "Melted Sundae", "mascara"];
  if (name.includes("Review")) return ["review", "try", "texture", "quality"];
  if (name.includes("Concerns")) return ["fake", "stock", "delivery", "issue"];
  if (name.includes("Official")) return ["@laglace_official", "TikTok", "official"];
  return ["reaction", "comment", "audience"];
}
function topicTakeaway(name) {
  if (name.includes("Purchase")) return "Clarify purchase paths, shade availability, and stock information.";
  if (name.includes("Product")) return "Shade and product naming are important hooks in the conversation.";
  if (name.includes("Review")) return "Real-use proof and texture claims help turn reactions into confidence.";
  if (name.includes("Concerns")) return "Keep issue tracking visible even when negative volume is small.";
  return "Use as supporting qualitative context.";
}
