import fs from "node:fs";
import path from "node:path";
import { parseArgs, printUsage } from "./args.mjs";
import { loadEnv, optionalEnv, optionalNumberEnv, requireEnv } from "./env.mjs";

loadEnv();

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.input) {
  printUsage("Search X posts with Apify and prepare reply-scraper input", [
    "npm run apify:x:search -- --input work/inputs/apify-x-search.json",
    "npm run apify:x:search -- --input work/inputs/apify-x-search.json --output work/raw/laglace-x-search.json --replies-input work/inputs/apify-x-replies-from-search.json"
  ]);
  process.exit(args.help ? 0 : 1);
}

const inputPath = path.resolve(String(args.input));
const outputPath = path.resolve(String(args.output || datedOutputPath("search")));
const repliesInputPath = path.resolve(String(args["replies-input"] || "work/inputs/apify-x-replies-from-search.json"));
const actorId = optionalEnv("APIFY_X_SEARCH_ACTOR_ID", "scrapersdelight/x-tweet-search-scraper");
const token = requireEnv("APIFY_API_TOKEN");

const rows = await runApify(actorId, token, inputPath, outputPath);
const urls = extractTweetUrls(rows);
const repliesInput = {
  urls,
  category: String(args.category || "replies"),
  resultsPerCategory: Number(args["results-per-tweet"] || optionalNumberEnv("SOCIAL_X_REPLIES_PER_POST", 100) || 100),
  parseAllResults: Boolean(args["parse-all"]),
  retweetCheckUsername: String(args["retweet-check-username"] || "")
};

fs.mkdirSync(path.dirname(repliesInputPath), { recursive: true });
fs.writeFileSync(repliesInputPath, `${JSON.stringify(repliesInput, null, 2)}\n`);

console.log(JSON.stringify({
  actorId,
  rawItems: rows.length,
  tweetUrls: urls.length,
  outputPath: path.relative(process.cwd(), outputPath),
  repliesInputPath: path.relative(process.cwd(), repliesInputPath)
}, null, 2));

async function runApify(actorId, token, inputPath, outputPath) {
  const input = JSON.parse(fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, ""));
  const actorPath = actorId.replace("/", "~");
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
    throw new Error(`Apify X search failed ${response.status}: ${body.slice(0, 500)}`);
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${body.trim() || "[]"}\n`);
  const parsed = JSON.parse(body || "[]");
  return Array.isArray(parsed) ? parsed : [];
}

function extractTweetUrls(rows) {
  const seen = new Set();
  const urls = [];
  for (const row of rows) {
    const value = pickString(row, ["url", "tweetUrl", "twitterUrl", "link", "permalink"]);
    const id = pickString(row, ["id", "tweetId", "id_str", "rest_id"]);
    const url = normalizeTweetUrl(value || (id ? `https://x.com/i/web/status/${id}` : ""));
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

function normalizeTweetUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d+$/.test(raw)) return `https://x.com/i/web/status/${raw}`;
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "").replace("twitter.com", "x.com");
    if (host !== "x.com" && !host.endsWith(".x.com")) return "";
    const match = url.pathname.match(/\/status\/(\d+)/);
    return match ? `https://x.com${url.pathname}` : "";
  } catch {
    return "";
  }
}

function pickString(source, keys) {
  for (const key of keys) {
    const value = key.split(".").reduce((acc, part) => acc && acc[part], source);
    if (value !== undefined && value !== null && value !== "") return String(value).trim();
  }
  return "";
}

function datedOutputPath(kind) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `work/raw/laglace-x-apify-${kind}-${stamp}.json`;
}
