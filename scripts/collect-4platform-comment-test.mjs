import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { envList, getDatasetId, loadEnv, optionalNumberEnv } from "./env.mjs";

loadEnv();

const args = new Set(process.argv.slice(2));
const shouldRun = args.has("--run");
const limit = optionalNumberEnv("SOCIAL_COMMENT_TEST_LIMIT", 10) ?? 10;
const selectedPlatformValues = envList("SOCIAL_COMMENT_TEST_PLATFORMS");
const selectedPlatforms = new Set((selectedPlatformValues.length ? selectedPlatformValues : ["tiktok", "instagram", "facebook", "youtube"])
  .map((platform) => platform.toLowerCase()));

const tests = [
  { key: "tiktok", platform: "TikTok", dataset: "tiktok-comments", input: "work/inputs/laglace-brightdata-tiktok-comments-500.json" },
  { key: "instagram", platform: "Instagram", dataset: "instagram-comments", input: "work/inputs/laglace-brightdata-instagram-comments-500.json" },
  { key: "facebook", platform: "Facebook", dataset: "facebook-comments", input: "work/inputs/laglace-brightdata-facebook-comments-500.json" },
  { key: "youtube", platform: "YouTube", dataset: "youtube-comments", input: "work/inputs/laglace-brightdata-youtube-comments-500.json" }
].filter((test) => selectedPlatforms.has(test.key));

const summary = [];

for (const test of tests) {
  const inputPath = path.join(process.cwd(), test.input);
  const rows = fs.existsSync(inputPath) ? JSON.parse(fs.readFileSync(inputPath, "utf8")) : [];
  let datasetReady = true;
  let datasetId = "";
  let datasetError = "";

  try {
    datasetId = getDatasetId(test.dataset);
  } catch (error) {
    datasetReady = false;
    datasetError = error.message;
  }

  const ready = datasetReady && rows.length > 0;
  const command = `npm run bright:collect -- --dataset ${test.dataset} --input ${test.input} --limit-per-input ${limit} --limit-total ${limit}`;

  summary.push({
    platform: test.platform,
    dataset: test.dataset,
    datasetReady,
    datasetId: datasetId ? `${datasetId.slice(0, 6)}...${datasetId.slice(-4)}` : "",
    input: test.input,
    rows: rows.length,
    limitPerInput: limit,
    limitTotal: limit,
    ready,
    command,
    note: ready ? "ready" : datasetError || "missing input URLs"
  });

  if (!shouldRun || !ready) continue;

  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(
    npmCommand,
    ["run", "bright:collect", "--", "--dataset", test.dataset, "--input", test.input, "--limit-per-input", String(limit), "--limit-total", String(limit)],
    { cwd: process.cwd(), stdio: "inherit", shell: true }
  );

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(JSON.stringify({ run: shouldRun, selectedPlatforms: Array.from(selectedPlatforms), summary }, null, 2));