import fs from "node:fs";
import path from "node:path";
import { loadEnv, optionalEnv, requireEnv } from "./env.mjs";

loadEnv();

const inputPath = process.argv[2];
const outputPath = process.argv[3] || datedOutputPath();
const actorId = optionalEnv("APIFY_X_ACTOR_ID", "api-ninja/x-twitter-replies-retweets-scraper");
const token = requireEnv("APIFY_API_TOKEN");

if (!inputPath) {
  console.error("Usage: node scripts/run-apify-x.mjs <actor-input.json> [output-json]");
  process.exit(1);
}

const input = JSON.parse(fs.readFileSync(path.resolve(inputPath), "utf8").replace(/^\uFEFF/, ""));
const actorPath = actorId.replace("/", "~");
const url = `https://api.apify.com/v2/acts/${encodeURIComponent(actorPath)}/run-sync-get-dataset-items?format=json&clean=true`;

const response = await fetch(url, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(input),
  signal: AbortSignal.timeout(300000)
});

const body = await response.text();
if (!response.ok) {
  throw new Error(`Apify request failed ${response.status}: ${body.slice(0, 500)}`);
}

const outputFullPath = path.resolve(outputPath);
fs.mkdirSync(path.dirname(outputFullPath), { recursive: true });
fs.writeFileSync(outputFullPath, `${body.trim() || "[]"}\n`);

let count = 0;
try {
  const parsed = JSON.parse(body || "[]");
  count = Array.isArray(parsed) ? parsed.length : 0;
} catch {
  count = 0;
}

console.log(JSON.stringify({ actorId, outputPath, items: count }, null, 2));

function datedOutputPath() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `work/raw/laglace-x-apify-${stamp}.json`;
}
