import fs from "node:fs";
import path from "node:path";
import { parseArgs, printUsage } from "./args.mjs";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.input || !args.platform) {
  printUsage("Normalize Bright Data raw JSON into reviewed evidence draft", [
    "npm run bright:normalize -- --platform TikTok --input work/raw/file.json --output work/reviewed/tiktok-draft.json",
    "npm run bright:normalize -- --platform X --input work/raw/file.json --output work/reviewed/x-draft.json"
  ]);
  process.exit(args.help ? 0 : 1);
}

const platform = String(args.platform);
if (!["TikTok", "Instagram", "X", "Facebook", "YouTube"].includes(platform)) {
  throw new Error("--platform must be TikTok, Instagram, X, Facebook, or YouTube");
}

const inputPath = path.resolve(process.cwd(), String(args.input));
const outputPath = path.resolve(process.cwd(), String(args.output ?? "work/reviewed/normalized-draft.json"));
const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const rows = Array.isArray(raw) ? raw : [raw];

const evidence = rows
  .map((item, index) => normalizeItem(item, platform, index))
  .filter((item) => item.text || item.sourceUrl);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`normalized: ${evidence.length}`);
console.log(`saved: ${path.relative(process.cwd(), outputPath)}`);

function normalizeItem(item, platformName, index) {
  const sourceUrl = pickString(item, ["comment_url", "url", "post_url", "tweet_url", "x_url", "video_url", "shortcode_url", "source_url", "input_url"]);
  const text = pickString(item, ["comment", "comment_text", "text", "caption", "description", "full_text", "tweet_text", "title", "commenter_user_name"]);
  const sourceId = pickString(item, ["id", "comment_id", "post_id", "tweet_id", "x_id", "video_id", "shortcode"]);
  const parentPostId = pickString(item, ["post_id", "tweet_id", "conversation_id", "video_id", "parent_post_id"]);
  const publishedAt = pickString(item, ["date_created", "date", "datetime", "timestamp", "created_at", "published_at", "posted_at"]) ?? new Date().toISOString();

  return {
    id: `${platformName.toLowerCase()}-${sourceId ?? index + 1}`,
    platform: platformName,
    recordType: looksLikeComment(item) ? "comment" : "post",
    sourceId,
    parentPostId,
    sourceUrl,
    publishedAt: normalizeDate(publishedAt),
    text: text ?? "",
    sentiment: null,
    topics: [],
    metrics: {
      likes: pickNumber(item, ["num_likes", "likes", "like_count", "digg_count"]),
      replies: pickNumber(item, ["num_replies", "replies", "reply_count"]),
      shares: pickNumber(item, ["shares", "share_count", "retweets", "reposts", "retweet_count", "repost_count"]),
      views: pickNumber(item, ["views", "view_count", "play_count"]),
      comments: pickNumber(item, ["comments", "comment_count"])
    },
    isDemo: false,
    user: pickString(item, ["user", "username", "user_name", "handle", "author", "author_name"]),
    authorName: pickString(item, ["name", "display_name", "authorName", "author_name", "user_full_name"]),
    matchedKeywords: [],
    engagement: pickNumber(item, ["engagement", "likes", "like_count", "views", "view_count"]),
    isIssue: false
  };
}

function pickString(item, keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}

function pickNumber(item, keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  }
  return null;
}

function looksLikeComment(item) {
  return Boolean(item?.comment_id || item?.comment_url || item?.comment || item?.comment_text || item?.reply_count || item?.parent_post_id);
}

function normalizeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? new Date().toISOString() : date.toISOString();
}
