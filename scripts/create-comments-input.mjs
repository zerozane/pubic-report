import fs from "node:fs";
import path from "node:path";
import { parseArgs, printUsage } from "./args.mjs";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.input || !args.output) {
  printUsage("Create TikTok comments input from discovered posts", [
    "node scripts/create-comments-input.mjs --input work/raw/posts.json --output work/inputs/tiktok-comments-test.json --limit 5"
  ]);
  process.exit(args.help ? 0 : 1);
}

const inputPath = path.resolve(process.cwd(), String(args.input));
const outputPath = path.resolve(process.cwd(), String(args.output));
const limit = Number(args.limit ?? 5);
const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const rows = Array.isArray(raw) ? raw : Array.isArray(raw.data) ? raw.data : [raw];

const seen = new Set();
const input = [];

for (const row of rows) {
  const url = typeof row.url === "string" ? row.url : null;
  if (!url || seen.has(url)) continue;
  seen.add(url);
  input.push({ url });
  if (input.length >= limit) break;
}

if (!input.length) {
  throw new Error("No TikTok post URLs found in input file.");
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(input, null, 2)}\n`);

console.log(`created: ${input.length}`);
console.log(`saved: ${path.relative(process.cwd(), outputPath)}`);
