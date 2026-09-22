import fs from "node:fs";
import path from "node:path";
import { parseArgs, printUsage } from "./args.mjs";
import { getDatasetId, loadEnv, requireEnv } from "./env.mjs";

loadEnv();

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.dataset || !args.input) {
  printUsage("Start a Bright Data collection", [
    "npm run bright:collect -- --dataset tiktok-search --input work/inputs/tiktok-search.json",
    "npm run bright:collect -- --dataset instagram-hashtag --input work/inputs/instagram-hashtag.json",
    "datasets: tiktok-search, tiktok-comments, instagram-hashtag, instagram-comments"
  ]);
  process.exit(args.help ? 0 : 1);
}

const apiKey = requireEnv("BRIGHT_DATA_API_KEY");
const datasetId = getDatasetId(args.dataset);
const inputPath = path.resolve(process.cwd(), String(args.input));
const payload = JSON.parse(fs.readFileSync(inputPath, "utf8"));

if (!Array.isArray(payload)) {
  throw new Error("Input file must be a JSON array matching the selected Bright Data scraper schema.");
}

const endpoint = String(args.endpoint ?? "trigger");
const url = new URL(`https://api.brightdata.com/datasets/v3/${endpoint}`);
url.searchParams.set("dataset_id", datasetId);
if (endpoint === "trigger") {
  url.searchParams.set("format", String(args.format ?? "json"));
  url.searchParams.set("uncompressed_webhook", "true");
} else {
  url.searchParams.set("notify", "false");
}
if (args.type) url.searchParams.set("type", String(args.type));
if (args["discover-by"]) url.searchParams.set("discover_by", String(args["discover-by"]));
if (args["limit-per-input"]) url.searchParams.set("limit_per_input", String(args["limit-per-input"]));
if (args["limit-total"]) url.searchParams.set("limit_multiple_results", String(args["limit-total"]));
if (args["include-errors"]) url.searchParams.set("include_errors", String(args["include-errors"]));

const scrapeInput = args["wrap-input"] ? [payload] : payload;
const body =
  endpoint === "scrape"
    ? {
        input: scrapeInput,
        limit_per_input: args["limit-per-input"] ? Number(args["limit-per-input"]) : null
      }
    : payload;

const response = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});

const responseText = await response.text();
const data = responseText ? safeJson(responseText) : {};
if (!response.ok) {
  throw new Error(`Bright Data trigger failed: ${response.status} ${responseText || "{}"}`);
}

const snapshotId = data.snapshot_id ?? data.id ?? data.snapshotId;
if (!snapshotId) {
  throw new Error(`No snapshot_id in response: ${JSON.stringify(data)}`);
}

const jobsDirectory = path.join(process.cwd(), "work", "jobs");
fs.mkdirSync(jobsDirectory, { recursive: true });

const job = {
  dataset: args.dataset,
  datasetId,
  snapshotId,
  inputPath,
  createdAt: new Date().toISOString(),
  response: data
};
const jobPath = path.join(jobsDirectory, `${args.dataset}-${snapshotId}.json`);
fs.writeFileSync(jobPath, `${JSON.stringify(job, null, 2)}\n`);

console.log(`Started ${args.dataset}`);
console.log(`snapshot_id: ${snapshotId}`);
console.log(`job file: ${path.relative(process.cwd(), jobPath)}`);

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
