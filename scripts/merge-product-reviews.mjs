import fs from "node:fs";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const originalPath = path.resolve(process.cwd(), String(args.original || "dataset_tiktok-reviews-scraper_2026.json"));
const addedPath = path.resolve(process.cwd(), String(args.added || "dataset_tiktok-reviews-scraper_2026-laglace 2.json"));
const outputPath = path.resolve(process.cwd(), String(args.output || "work/raw/laglace-all-product-reviews.json"));

const original = readRows(originalPath);
const added = readRows(addedPath);
const byReviewId = new Map();

for (const row of original) byReviewId.set(String(row.review_id), row);
for (const row of added) byReviewId.set(String(row.review_id), row);

const merged = Array.from(byReviewId.values());
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");

console.log(`Original rows: ${original.length}`);
console.log(`Added rows: ${added.length}`);
console.log(`Duplicate review IDs replaced by added file: ${original.length + added.length - merged.length}`);
console.log(`Merged unique rows: ${merged.length}`);
console.log(`Products: ${new Set(merged.map((row) => row.product_id)).size}`);
console.log(`Wrote: ${path.relative(process.cwd(), outputPath)}`);

function readRows(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Input file not found: ${filePath}`);
  const rows = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(rows)) throw new Error(`Input must be a JSON array: ${filePath}`);
  return rows;
}

function parseArgs(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) continue;
    result[value.slice(2)] = values[index + 1] && !values[index + 1].startsWith("--") ? values[++index] : true;
  }
  return result;
}
