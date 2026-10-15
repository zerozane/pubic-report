import path from "node:path";
import { parseArgs, printUsage } from "./args.mjs";
import { loadEnv, optionalEnv } from "./env.mjs";
import {
  downloadSnapshot,
  normalizeEvidence,
  normalizeRows,
  pickCommentInputFromPosts,
  readJson,
  startScrape,
  waitForSnapshot,
  writeJson
} from "./brightdata-client.mjs";

loadEnv();

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.input) {
  printUsage("Run TikTok test pipeline: keyword posts -> comments -> normalized JSON", [
    "npm run bright:test-tiktok -- --input work/inputs/tiktok-iphone18-th-keywords.json --name iphone18-th",
    "optional: --posts-per-keyword 5 --post-limit 10 --comments-per-post 10 --period-from 2026-01-01 --period-to 2026-12-31 --poll-seconds 30 --max-wait-minutes 10 --thai-only --dry-run",
    "direct URLs: npm run bright:collect -- --dataset tiktok-comments --input work/inputs/tiktok-comments.json --limit-per-input 10"
  ]);
  process.exit(args.help ? 0 : 1);
}

const name = String(args.name ?? path.basename(String(args.input), ".json"));
const postsPerKeyword = Number(args["posts-per-keyword"] ?? 3);
const postLimit = Number(args["post-limit"] ?? 5);
const commentsPerPost = Number(args["comments-per-post"] ?? 3);
const pollSeconds = Number(args["poll-seconds"] ?? 30);
const maxWaitMinutes = Number(args["max-wait-minutes"] ?? 10);
const dryRun = Boolean(args["dry-run"]);
const thaiOnly = Boolean(args["thai-only"]);
const periodFrom = String(args["period-from"] ?? optionalEnv("SOCIAL_PERIOD_FROM", "2026-01-01"));
const periodTo = String(args["period-to"] ?? optionalEnv("SOCIAL_PERIOD_TO", "2026-12-31T23:59:59+07:00"));
const period = parsePeriod(periodFrom, periodTo);
const input = readJson(String(args.input));

if (!Array.isArray(input)) {
  throw new Error("--input must be a JSON array.");
}
if (input.some((item) => !item?.search_keyword || item?.url)) {
  throw new Error("TikTok keyword test accepts only search_keyword inputs. Use bright:collect with tiktok-comments for direct URLs.");
}

console.log(`input keywords: ${input.length}`);
console.log(`posts per keyword: ${postsPerKeyword}`);
console.log(`post limit: ${postLimit}`);
console.log(`comments per post: ${commentsPerPost}`);
console.log(`thai-only post picking: ${thaiOnly ? "yes" : "no"}`);
console.log(`collection period: ${periodFrom} -> ${periodTo}`);

if (dryRun) {
  console.log("dry run: no Bright Data API calls made");
  process.exit(0);
}

console.log("starting TikTok keyword discovery...");
const postsJob = await startScrape({
  dataset: "tiktok-search",
  input,
  limitPerInput: postsPerKeyword,
  type: "discover_new",
  discoverBy: "keyword"
});
console.log(`posts snapshot: ${postsJob.snapshotId}`);

await waitForSnapshot(postsJob.snapshotId, { pollSeconds, maxWaitMinutes, timeoutMs: 90000 });
const postsRaw = normalizeRows(await downloadSnapshot(postsJob.snapshotId, { timeoutMs: 90000 }));
const postsRawPath = `work/raw/${name}-posts-${postsJob.snapshotId}.json`;
writeJson(postsRawPath, postsRaw);
console.log(`saved posts raw: ${postsRawPath}`);

const postsReviewedPath = `work/reviewed/${name}-posts-normalized.json`;
const postsNormalized = normalizeEvidence(postsRaw, "TikTok");
writeJson(postsReviewedPath, postsNormalized.filter((item) => isInPeriod(item.publishedAt, period)));
console.log(`saved posts normalized: ${postsReviewedPath}`);

const commentsInput = pickCommentInputFromPosts(postsRaw, { postLimit, requireThai: thaiOnly, periodFrom, periodTo });
if (!commentsInput.length) {
  throw new Error("No post URLs selected for comments. Try without --thai-only or increase post discovery keywords.");
}

const commentsInputPath = `work/inputs/${name}-comments.json`;
writeJson(commentsInputPath, commentsInput);
console.log(`saved comments input: ${commentsInputPath}`);

console.log("starting TikTok comments collection...");
const commentsJob = await startScrape({
  dataset: "tiktok-comments",
  input: commentsInput,
  limitPerInput: commentsPerPost
});
console.log(`comments snapshot: ${commentsJob.snapshotId}`);

await waitForSnapshot(commentsJob.snapshotId, { pollSeconds, maxWaitMinutes, timeoutMs: 90000 });
const commentsRaw = normalizeRows(await downloadSnapshot(commentsJob.snapshotId, { timeoutMs: 90000 }));
const commentsRawPath = `work/raw/${name}-comments-${commentsJob.snapshotId}.json`;
writeJson(commentsRawPath, commentsRaw);
console.log(`saved comments raw: ${commentsRawPath}`);

const commentsReviewedPath = `work/reviewed/${name}-comments-normalized.json`;
const commentsNormalized = normalizeEvidence(commentsRaw, "TikTok");
writeJson(commentsReviewedPath, commentsNormalized.filter((item) => isInPeriod(item.publishedAt, period)));
console.log(`saved comments normalized: ${commentsReviewedPath}`);

console.log("TikTok test pipeline complete.");

function parsePeriod(fromValue, toValue) {
  const from = Date.parse(fromValue);
  const to = Date.parse(toValue);
  if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) {
    throw new Error(`Invalid collection period: ${fromValue} -> ${toValue}`);
  }
  return { from, to };
}

function isInPeriod(value, periodRange) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp >= periodRange.from && timestamp <= periodRange.to;
}
