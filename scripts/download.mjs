import fs from "node:fs";
import path from "node:path";
import { parseArgs, printUsage } from "./args.mjs";
import { loadEnv, requireEnv } from "./env.mjs";

loadEnv();

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.snapshot) {
  printUsage("Download a Bright Data snapshot", [
    "npm run bright:download -- --snapshot <snapshot_id> --name tiktok-search",
    "optional: --format json"
  ]);
  process.exit(args.help ? 0 : 1);
}

const apiKey = requireEnv("BRIGHT_DATA_API_KEY");
const snapshotId = String(args.snapshot);
const format = String(args.format ?? "json");
const timeoutMs = Number(args.timeout ?? 60000);

const progressResponse = await fetchWithTimeout(`https://api.brightdata.com/datasets/v3/progress/${snapshotId}`, {
  headers: { Authorization: `Bearer ${apiKey}` }
}, timeoutMs);
const progress = await progressResponse.json().catch(() => ({}));
if (!progressResponse.ok) {
  throw new Error(`Progress check failed: ${progressResponse.status} ${JSON.stringify(progress)}`);
}

console.log(`status: ${progress.status ?? progress.state ?? "unknown"}`);

const snapshotUrl = new URL(`https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}`);
snapshotUrl.searchParams.set("format", format);

const response = await fetchWithTimeout(snapshotUrl, {
  headers: { Authorization: `Bearer ${apiKey}` }
}, timeoutMs);

if (!response.ok) {
  const text = await response.text();
  throw new Error(`Snapshot download failed: ${response.status} ${text}`);
}

const raw = await response.text();
const rawDirectory = path.join(process.cwd(), "work", "raw");
fs.mkdirSync(rawDirectory, { recursive: true });

const baseName = args.name ? String(args.name) : "snapshot";
const extension = format === "csv" ? "csv" : "json";
const outputPath = path.join(rawDirectory, `${baseName}-${snapshotId}.${extension}`);
fs.writeFileSync(outputPath, raw);

console.log(`saved: ${path.relative(process.cwd(), outputPath)}`);

async function fetchWithTimeout(url, options, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
