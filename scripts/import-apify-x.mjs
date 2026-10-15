import fs from "node:fs";
import path from "node:path";
import { classifySocialSentiment } from "./sentiment-rules.mjs";

const inputPath = process.argv[2];
const reportPath = process.argv[3] || "data/reports/laglace-social-report.json";
const periodFrom = "2026-09-01";
const periodTo = "2026-09-30";

if (!inputPath) {
  console.error("Usage: node scripts/import-apify-x.mjs <apify-dataset-export.json> [report-json]");
  process.exit(1);
}

const rows = readRows(inputPath);
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const xEvidence = rows
  .map(toEvidence)
  .filter(Boolean)
  .filter((item) => {
    const day = item.publishedAt.slice(0, 10);
    return day >= periodFrom && day <= periodTo;
  });

const withoutX = report.evidence.filter((item) => item.platform !== "X");
report.evidence = [...withoutX, ...xEvidence].sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt));

const counts = countByPlatform(report.evidence);
report.summary = `La Glace social listening report filtered to September 1-30, 2026. Current audited dataset contains ${report.evidence.length} records from TikTok, Facebook${counts.X ? ", and X" : ""}. Instagram September records are pending additional collection${counts.X ? "" : ", and X can be added by importing an Apify dataset export"}.`;
report.methodology.source = `Bright Data TikTok comments + Facebook posts/comments filtered to 1-30 Sep 2026${counts.X ? " + Apify X replies filtered to the same period" : ""}. Instagram September records are pending additional collection.`;
report.methodology.selection = `Includes only records whose published date is between 2026-09-01 and 2026-09-30. Current September cut includes TikTok comments, Facebook comments${counts.X ? ", and X replies" : ""}; Instagram is excluded until valid September source records are collected.`;
report.methodology.limitations = [
  `Current September dataset is not yet a complete 4-platform cut: Instagram September records are missing from available raw data${counts.X ? "" : ", and X is pending Apify import"}.`,
  "Facebook coverage is limited to posts discovered from official page URLs that had visible comments.",
  "X coverage depends on the tweet URLs or IDs submitted to Apify, so it should be interpreted as a sourced sample rather than a full-platform crawl.",
  "Sentiment is text-based and should be reviewed for sarcasm, slang, and brand-specific context before final publishing."
];

const gap = report.insights.find((item) => item.id === "sep2026-platform-gap");
if (gap) {
  gap.title = "4-platform September comparison is not complete yet";
  gap.description = counts.X
    ? "The current September source data includes TikTok, Facebook, and X. Instagram discovery returned no September records, so it must be collected before a true 4-platform view."
    : "The current September source data includes TikTok and Facebook. Instagram still requires September collection, and X should be imported from Apify results before a true 4-platform view.";
  gap.recommendation = counts.X
    ? "Collect Instagram source records specifically for 1-30 Sep 2026 before presenting channel comparison as complete."
    : "Import X replies from Apify and collect Instagram source records specifically for 1-30 Sep 2026 before presenting channel comparison as complete.";
}

if (report.dashboard?.ingestion) {
  report.dashboard.description = `September 2026 cut from scraped La Glace public conversation. Current audited records include TikTok, Facebook${counts.X ? ", and X" : ""}; Instagram still needs September collection.`;
  report.dashboard.ingestion.connectedSources = [
    source("TikTok Comments", "September comments", "TikTok", counts.TikTok || 0, "Connected"),
    source("Facebook Comments", "September official page comments", "Facebook", counts.Facebook || 0, "Connected"),
    source("Instagram", "September comments", "Instagram", counts.Instagram || 0, counts.Instagram ? "Connected" : "Pending collection"),
    source("X Apify Replies", "September replies from Apify", "X", counts.X || 0, counts.X ? "Connected" : "Pending Apify import")
  ];
}

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ importedX: xEvidence.length, totalRecords: report.evidence.length, reportPath }, null, 2));

function readRows(file) {
  const text = fs.readFileSync(path.resolve(file), "utf8").replace(/^\uFEFF/, "");
  const value = JSON.parse(text);
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.datasetItems)) return value.datasetItems;
  throw new Error("Apify export must be a JSON array or an object with items/data/datasetItems.");
}

function toEvidence(item, index) {
  const text = pickString(item, [
    "full_text", "fullText", "tweetText", "replyText", "text", "content", "body", "description",
    "legacy.full_text", "legacy.text"
  ]);
  if (!text) return null;

  const publishedAt = normalizeDate(pickString(item, [
    "created_at", "createdAt", "date", "timestamp", "publishedAt", "time", "legacy.created_at"
  ]));
  if (!publishedAt) return null;

  const sourceId = String(pickAny(item, ["tweet_id", "id_str", "id", "tweetId", "replyId", "rest_id", "legacy.id_str"]) || `row-${index + 1}`);
  const screenName = pickString(item, ["screen_name", "username", "userName", "author.userName", "author.username", "user.screen_name", "user_info.screen_name"]);
  const sourceUrl = normalizeXUrl(pickString(item, ["url", "tweetUrl", "replyUrl", "link", "permalink"]), sourceId, screenName);
  const parentReplyId = pickString(item, ["in_reply_to_status_id_str", "inReplyToStatusId", "in_reply_to_status_id"]);
  const parentHandle = handleFromUrl(pickString(item, ["metadata.sourceInput", "metadata.sourceTweetUrl"]));
  if (pickString(item, ["metadata.category"]).toLowerCase() === "replies") {
    if (!parentReplyId) return null;
    if (parentHandle && screenName.toLowerCase() === parentHandle.toLowerCase()) return null;
  }

  const sentiment = classifySocialSentiment(text);
  const metrics = {
    likes: numberLike(pickAny(item, ["favorites", "likes", "likeCount", "favorite_count", "favoriteCount", "legacy.favorite_count"])),
    replies: numberLike(pickAny(item, ["replies", "replyCount", "conversationCount", "legacy.reply_count"])),
    shares: numberLike(pickAny(item, ["retweets", "retweetCount", "reposts", "quoteCount", "legacy.retweet_count"])),
    views: numberLike(pickAny(item, ["views", "viewCount", "impressionCount"]))
  };

  return {
    id: uniqueId(`x-${sourceId}`),
    platform: "X",
    recordType: "comment",
    sourceId,
    parentPostId: nullableString(pickAny(item, ["metadata.sourceTweetId", "conversation_id", "conversationId", "in_reply_to_status_id_str", "inReplyToStatusId", "tweetId"])),
    sourceUrl,
    publishedAt,
    text,
    sentiment,
    topics: ["X Apify replies"],
    metrics,
    isDemo: false,
    user: screenName,
    authorName: pickString(item, ["authorName", "author.name", "user.name", "user_info.name", "name"]),
    matchedKeywords: ["La Glace", "X", "Apify", "Sep 2026"],
    engagement: Object.values(metrics).reduce((sum, value) => sum + (value || 0), 0),
    isIssue: sentiment === "negative"
  };
}

function pickAny(source, keys) {
  for (const key of keys) {
    const value = key.split(".").reduce((acc, part) => acc && acc[part], source);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function pickString(source, keys) {
  const value = pickAny(source, keys);
  return value === null ? "" : String(value).trim();
}

function nullableString(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function normalizeDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

function handleFromUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[0] && parts[0] !== "i" ? parts[0] : "";
  } catch {
    return "";
  }
}

function normalizeXUrl(value, sourceId, screenName = "") {
  const raw = String(value || "").trim();
  if (/^https?:\/\/(x|twitter)\.com\//i.test(raw)) return raw.replace("twitter.com", "x.com").replace("/i/status/", "/i/web/status/");
  if (screenName && sourceId && !String(sourceId).startsWith("row-")) return `https://x.com/${screenName}/status/${sourceId}`;
  if (sourceId && !String(sourceId).startsWith("row-")) return `https://x.com/i/web/status/${sourceId}`;
  return null;
}

function numberLike(value) {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function uniqueId(value) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function countByPlatform(evidence) {
  return evidence.reduce((acc, item) => {
    acc[item.platform] = (acc[item.platform] || 0) + 1;
    return acc;
  }, {});
}

function source(name, type, platform, count, status) {
  return {
    name,
    type,
    status,
    count: `${count} records`,
    platform
  };
}
