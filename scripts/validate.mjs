import fs from "node:fs";
import path from "node:path";

const reportsDirectory = path.join(process.cwd(), "data", "reports");
const files = fs.existsSync(reportsDirectory)
  ? fs.readdirSync(reportsDirectory).filter((file) => file.endsWith(".json") && !file.endsWith("-product-quality.json"))
  : [];

let errorCount = 0;
let warningCount = 0;

for (const file of files) {
  const report = JSON.parse(fs.readFileSync(path.join(reportsDirectory, file), "utf8"));
  const prefix = `${file}:`;

  requireString(report.slug, `${prefix} slug`);
  requireString(report.title, `${prefix} title`);
  requireArray(report.evidence, `${prefix} evidence`);

  const periodFrom = Date.parse(report.period?.from ?? "");
  const periodTo = Date.parse(report.period?.to ?? "");
  if (!Number.isFinite(periodFrom) || !Number.isFinite(periodTo) || periodFrom > periodTo) {
    fail(`${prefix} invalid period.from/period.to`);
  }

  let outsidePeriodCount = 0;

  const ids = new Set();
  for (const item of report.evidence ?? []) {
    requireString(item.id, `${prefix} evidence.id`);
    if (ids.has(item.id)) fail(`${prefix} duplicate evidence id "${item.id}"`);
    ids.add(item.id);
    if (!["TikTok", "Instagram", "X", "Facebook", "YouTube"].includes(item.platform)) fail(`${prefix} invalid platform "${item.platform}"`);
    if (!["post", "comment"].includes(item.recordType)) fail(`${prefix} invalid recordType "${item.recordType}"`);
    const publishedAt = Date.parse(item.publishedAt ?? "");
    if (!Number.isFinite(publishedAt)) fail(`${prefix} evidence "${item.id}" has invalid publishedAt`);
    else if (publishedAt < periodFrom || publishedAt > periodTo) outsidePeriodCount += 1;
    if (item.sentiment !== null && !["positive", "neutral", "negative"].includes(item.sentiment)) {
      fail(`${prefix} invalid sentiment "${item.sentiment}"`);
    }
    if (!item.metrics || typeof item.metrics !== "object" || Array.isArray(item.metrics)) {
      fail(`${prefix} evidence "${item.id}" metrics must be an object`);
    } else {
      for (const [name, value] of Object.entries(item.metrics)) {
        if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
          fail(`${prefix} evidence "${item.id}" metric ${name} must be a non-negative number or null`);
        }
      }
    }
  }

  if (outsidePeriodCount) {
    warn(`${prefix} ${outsidePeriodCount}/${report.evidence.length} evidence records fall outside report.period`);
  }

  for (const insight of report.insights ?? []) {
    for (const evidenceId of insight.evidenceIds ?? []) {
      if (!ids.has(evidenceId)) fail(`${prefix} insight "${insight.id}" references missing evidence "${evidenceId}"`);
    }
  }

  if (report.status === "published") {
    for (const item of report.evidence ?? []) {
      if (item.isDemo) fail(`${prefix} published report contains demo evidence "${item.id}"`);
    }
  }
}

if (errorCount) {
  process.exit(1);
}

console.log(`Validated ${files.length} report file(s)${warningCount ? ` with ${warningCount} warning(s)` : ""}.`);

function requireString(value, label) {
  if (typeof value !== "string" || !value.trim()) fail(`${label} is required`);
}

function requireArray(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
}

function fail(message) {
  errorCount += 1;
  console.error(message);
}

function warn(message) {
  warningCount += 1;
  console.warn(`warning: ${message}`);
}
