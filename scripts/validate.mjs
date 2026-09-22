import fs from "node:fs";
import path from "node:path";

const reportsDirectory = path.join(process.cwd(), "data", "reports");
const files = fs.existsSync(reportsDirectory)
  ? fs.readdirSync(reportsDirectory).filter((file) => file.endsWith(".json"))
  : [];

let errorCount = 0;

for (const file of files) {
  const report = JSON.parse(fs.readFileSync(path.join(reportsDirectory, file), "utf8"));
  const prefix = `${file}:`;

  requireString(report.slug, `${prefix} slug`);
  requireString(report.title, `${prefix} title`);
  requireArray(report.evidence, `${prefix} evidence`);

  const ids = new Set();
  for (const item of report.evidence ?? []) {
    requireString(item.id, `${prefix} evidence.id`);
    if (ids.has(item.id)) fail(`${prefix} duplicate evidence id "${item.id}"`);
    ids.add(item.id);
    if (!["TikTok", "Instagram"].includes(item.platform)) fail(`${prefix} invalid platform "${item.platform}"`);
    if (!["post", "comment"].includes(item.recordType)) fail(`${prefix} invalid recordType "${item.recordType}"`);
    if (item.sentiment !== null && !["positive", "neutral", "negative"].includes(item.sentiment)) {
      fail(`${prefix} invalid sentiment "${item.sentiment}"`);
    }
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

console.log(`Validated ${files.length} report file(s).`);

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
