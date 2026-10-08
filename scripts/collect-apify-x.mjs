import fs from "node:fs";
import path from "node:path";
import { parseArgs, printUsage } from "./args.mjs";
import { loadEnv, optionalEnv, requireEnv } from "./env.mjs";
import { classifyModernSentiment } from "./sentiment-rules.mjs";

loadEnv();

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.input) {
  printUsage("Run Apify X replies scraper and import results into the report", [
    "npm run apify:x:collect -- --input work/inputs/apify-x-replies.json",
    "npm run apify:x:collect -- --input work/inputs/apify-x-replies.json --output work/raw/laglace-x-apify.json",
    "Input schema: { \"urls\": [\"https://x.com/user/status/123\"], \"category\": \"replies\", \"resultsPerCategory\": 100, \"parseAllResults\": false }"
  ]);
  process.exit(args.help ? 0 : 1);
}

const inputPath = path.resolve(String(args.input));
const outputPath = path.resolve(String(args.output || datedOutputPath()));
const reportPath = path.resolve(String(args.report || "data/reports/laglace-social-report.json"));

const rows = await runApify(inputPath, outputPath);
const imported = importIntoReport(rows, reportPath);

console.log(JSON.stringify({ outputPath: path.relative(process.cwd(), outputPath), reportPath: path.relative(process.cwd(), reportPath), ...imported }, null, 2));

async function runApify(inputPath, outputPath) {
  const actorId = optionalEnv("APIFY_X_ACTOR_ID", "api-ninja/x-twitter-replies-retweets-scraper");
  const token = requireEnv("APIFY_API_TOKEN");
  const actorPath = actorId.replace("/", "~");
  const input = JSON.parse(fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, ""));
  const url = `https://api.apify.com/v2/acts/${encodeURIComponent(actorPath)}/run-sync-get-dataset-items?format=json&clean=true`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(300000)
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Apify request failed ${response.status}: ${body.slice(0, 500)}`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${body.trim() || "[]"}\n`);

  const parsed = JSON.parse(body || "[]");
  return Array.isArray(parsed) ? parsed : [];
}

function importIntoReport(rows, reportPath) {
  const periodFrom = "2026-09-01";
  const periodTo = "2026-09-30";
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
  updateReportCopy(report, xEvidence.length);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return { rawItems: rows.length, importedX: xEvidence.length, totalRecords: report.evidence.length };
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

  const sentiment = classifyModernSentiment(text) || "neutral";
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

function updateReportCopy(report, xCount) {
  const counts = report.evidence.reduce((acc, item) => {
    acc[item.platform] = (acc[item.platform] || 0) + 1;
    return acc;
  }, {});
  report.summary = `La Glace social listening report filtered to September 1-30, 2026. Current audited dataset contains ${report.evidence.length} records from TikTok, Facebook${counts.X ? ", and X" : ""}. Instagram September records are pending additional collection.`;
  report.methodology.source = `Bright Data TikTok comments + Facebook posts/comments filtered to 1-30 Sep 2026${counts.X ? " + Apify X replies filtered to the same period" : ""}. Instagram September records are pending additional collection.`;
  report.methodology.selection = `Includes only records whose published date is between 2026-09-01 and 2026-09-30. Current September cut includes TikTok comments, Facebook comments${counts.X ? ", and X replies" : ""}; Instagram is excluded until valid September source records are collected.`;
  report.methodology.limitations = [
    `Current September dataset is not yet a complete 4-platform cut: Instagram September records are missing from available raw data${counts.X ? "" : ", and X is pending Apify import"}.`,
    "Facebook coverage is limited to posts discovered from official page URLs that had visible comments.",
    "X coverage depends on the tweet URLs or IDs submitted to Apify, so it should be interpreted as a sourced sample rather than a full-platform crawl.",
    "Sentiment is text-based and should be reviewed for sarcasm, slang, and brand-specific context before final publishing."
  ];
  if (report.dashboard?.ingestion) {
    report.dashboard.description = `September 2026 cut from scraped La Glace public conversation. Current audited records include TikTok, Facebook${counts.X ? ", and X" : ""}; Instagram still needs September collection.`;
    report.dashboard.ingestion.connectedSources = [
      source("TikTok Comments", "September comments", "TikTok", counts.TikTok || 0, "Connected"),
      source("Facebook Comments", "September official page comments", "Facebook", counts.Facebook || 0, "Connected"),
      source("Instagram", "September comments", "Instagram", counts.Instagram || 0, counts.Instagram ? "Connected" : "Pending collection"),
      source("X Apify Replies", "September replies from Apify", "X", counts.X || 0, xCount ? "Connected" : "Pending Apify import")
    ];
  }
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

function source(name, type, platform, count, status) {
  return { name, type, status, count: `${count} records`, platform };
}

function datedOutputPath() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `work/raw/laglace-x-apify-${stamp}.json`;
}
