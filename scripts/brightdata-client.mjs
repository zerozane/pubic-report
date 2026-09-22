import fs from "node:fs";
import path from "node:path";
import { getDatasetId, requireEnv } from "./env.mjs";

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), filePath), "utf8"));
}

export function writeJson(filePath, data) {
  const outputPath = path.resolve(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`);
  return outputPath;
}

export async function startScrape({ dataset, input, limitPerInput = null, type, discoverBy, includeErrors = true }) {
  const apiKey = requireEnv("BRIGHT_DATA_API_KEY");
  const datasetId = getDatasetId(dataset);
  const url = new URL("https://api.brightdata.com/datasets/v3/scrape");
  url.searchParams.set("dataset_id", datasetId);
  url.searchParams.set("notify", "false");
  if (includeErrors) url.searchParams.set("include_errors", "true");
  if (type) url.searchParams.set("type", type);
  if (discoverBy) url.searchParams.set("discover_by", discoverBy);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input,
      limit_per_input: limitPerInput
    })
  });

  const text = await response.text();
  const data = text ? safeJson(text) : {};
  if (!response.ok) {
    throw new Error(`Bright Data scrape failed: ${response.status} ${text || "{}"}`);
  }

  const snapshotId = data.snapshot_id ?? data.id ?? data.snapshotId;
  if (!snapshotId) {
    throw new Error(`No snapshot_id in response: ${JSON.stringify(data)}`);
  }

  return { snapshotId, response: data, datasetId };
}

export async function getProgress(snapshotId, timeoutMs = 60000) {
  const apiKey = requireEnv("BRIGHT_DATA_API_KEY");
  const response = await fetchWithTimeout(`https://api.brightdata.com/datasets/v3/progress/${snapshotId}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  }, timeoutMs);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Progress check failed: ${response.status} ${JSON.stringify(data)}`);
  }
  return data;
}

export async function waitForSnapshot(snapshotId, { pollSeconds = 30, maxWaitMinutes = 10, timeoutMs = 60000 } = {}) {
  const startedAt = Date.now();
  const maxWaitMs = maxWaitMinutes * 60 * 1000;

  while (true) {
    const progress = await getProgress(snapshotId, timeoutMs);
    const status = progress.status ?? progress.state ?? "unknown";
    console.log(`snapshot ${snapshotId}: ${status}`);

    if (["ready", "done", "success", "completed"].includes(String(status).toLowerCase())) {
      return progress;
    }
    if (["failed", "error", "canceled", "cancelled"].includes(String(status).toLowerCase())) {
      throw new Error(`Snapshot ${snapshotId} ended with status ${status}`);
    }
    if (Date.now() - startedAt > maxWaitMs) {
      throw new Error(`Timed out waiting for snapshot ${snapshotId}`);
    }

    await sleep(pollSeconds * 1000);
  }
}

export async function downloadSnapshot(snapshotId, { format = "json", timeoutMs = 60000 } = {}) {
  const apiKey = requireEnv("BRIGHT_DATA_API_KEY");
  const url = new URL(`https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}`);
  url.searchParams.set("format", format);
  const response = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${apiKey}` }
  }, timeoutMs);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Snapshot download failed: ${response.status} ${text}`);
  }

  const text = await response.text();
  return text ? safeJson(text) : [];
}

export function normalizeRows(data) {
  return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [data];
}

export function normalizeEvidence(rows, platformName) {
  return rows
    .map((item, index) => normalizeItem(item, platformName, index))
    .filter((item) => item.text || item.sourceUrl);
}

export function pickCommentInputFromPosts(posts, { postLimit = 5, requireThai = false } = {}) {
  const picked = [];
  const seen = new Set();
  const sorted = posts
    .slice()
    .filter((post) => Number(post.comment_count ?? post.metrics?.comments ?? 0) > 0)
    .sort((left, right) => Number(right.comment_count ?? right.metrics?.comments ?? 0) - Number(left.comment_count ?? left.metrics?.comments ?? 0));

  for (const post of sorted) {
    const text = [post.description, post.text, post.hashtags?.join(" ")].filter(Boolean).join(" ");
    if (requireThai && !/[ก-๙]/.test(text)) continue;
    const url = post.url ?? post.sourceUrl;
    if (!url || seen.has(url)) continue;
    seen.add(url);
    picked.push({ url });
    if (picked.length >= postLimit) break;
  }

  return picked;
}

function normalizeItem(item, platformName, index) {
  const sourceUrl = pickString(item, ["comment_url", "url", "post_url", "video_url", "shortcode_url", "source_url", "input_url"]);
  const text = pickString(item, ["comment", "comment_text", "text", "caption", "description", "title", "commenter_user_name"]);
  const sourceId = pickString(item, ["id", "comment_id", "post_id", "video_id", "shortcode"]);
  const parentPostId = pickString(item, ["post_id", "video_id", "parent_post_id"]);
  const publishedAt = pickString(item, ["date_created", "date", "datetime", "timestamp", "created_at", "published_at"]) ?? new Date().toISOString();

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
      shares: pickNumber(item, ["shares", "share_count"]),
      views: pickNumber(item, ["views", "view_count", "play_count"]),
      comments: pickNumber(item, ["comments", "comment_count"])
    },
    isDemo: false
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

async function fetchWithTimeout(url, options, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
