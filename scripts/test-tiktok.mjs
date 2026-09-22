import path from "node:path";
import { parseArgs, printUsage } from "./args.mjs";
import { loadEnv } from "./env.mjs";
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
    "optional: --posts-per-keyword 5 --post-limit 10 --comments-per-post 10 --poll-seconds 30 --max-wait-minutes 10 --thai-only --dry-run"
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
const input = readJson(String(args.input));

if (!Array.isArray(input)) {
  throw new Error("--input must be a JSON array.");
}

console.log(`input keywords: ${input.length}`);
console.log(`posts per keyword: ${postsPerKeyword}`);
console.log(`post limit: ${postLimit}`);
console.log(`comments per post: ${commentsPerPost}`);
console.log(`thai-only post picking: ${thaiOnly ? "yes" : "no"}`);

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
writeJson(postsReviewedPath, normalizeEvidence(postsRaw, "TikTok"));
console.log(`saved posts normalized: ${postsReviewedPath}`);

const commentsInput = pickCommentInputFromPosts(postsRaw, { postLimit, requireThai: thaiOnly });
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
writeJson(commentsReviewedPath, normalizeEvidence(commentsRaw, "TikTok"));
console.log(`saved comments normalized: ${commentsReviewedPath}`);

console.log("TikTok test pipeline complete.");
