import fs from "node:fs";
import path from "node:path";
import { envList, loadEnv, optionalNumberEnv } from "./env.mjs";

loadEnv();

const outputDir = path.join(process.cwd(), "work", "inputs");
fs.mkdirSync(outputDir, { recursive: true });

const defaultTikTokUrls = readUrlsFromJson("work/inputs/laglace-test-comments.json");
const defaultInstagramUrls = readUrlsFromJson("work/inputs/laglace-instagram-comments-discovered-10.json");
const defaultFacebookUrls = readUrlsFromJson("work/inputs/laglace-facebook-comments-discovered-10.json");
const limit = optionalNumberEnv("SOCIAL_COMMENT_TEST_LIMIT", 10) ?? 10;
const urlsPerPlatform = optionalNumberEnv("SOCIAL_COMMENT_TEST_URLS_PER_PLATFORM", 1) ?? 1;
const selectedPlatformValues = envList("SOCIAL_COMMENT_TEST_PLATFORMS");
const selectedPlatforms = new Set((selectedPlatformValues.length ? selectedPlatformValues : ["tiktok", "instagram", "facebook", "youtube"])
  .map((platform) => platform.toLowerCase()));

const configs = [
  { key: "tiktok", file: "laglace-brightdata-tiktok-comments-500.json", env: "SOCIAL_TIKTOK_COMMENT_URLS", fallbackUrls: defaultTikTokUrls, extra: {} },
  { key: "instagram", file: "laglace-brightdata-instagram-comments-500.json", env: "SOCIAL_INSTAGRAM_COMMENT_URLS", fallbackUrls: defaultInstagramUrls, extra: {} },
  { key: "facebook", file: "laglace-brightdata-facebook-comments-500.json", env: "SOCIAL_FACEBOOK_COMMENT_URLS", fallbackUrls: defaultFacebookUrls, extra: { limit_records: limit, get_all_replies: false, comments_sort: "" } },
  { key: "youtube", file: "laglace-brightdata-youtube-comments-500.json", env: "SOCIAL_YOUTUBE_COMMENT_URLS", fallbackUrls: [], extra: { num_of_comments: limit, load_replies: 0, sort_by: "" } }
].filter((config) => selectedPlatforms.has(config.key));

const outputs = configs.map((config) => {
  const envUrls = envList(config.env);
  const urls = envUrls.length ? envUrls : config.fallbackUrls;
  const rows = urls.slice(0, urlsPerPlatform).map((url) => ({ url, ...config.extra }));
  const outputPath = path.join(outputDir, config.file);
  fs.writeFileSync(outputPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  return {
    platform: config.key,
    file: path.relative(process.cwd(), outputPath),
    rows: rows.length,
    limitPerInput: limit,
    limitTotalTarget: limit,
    urlsPerPlatform,
    urlEnv: config.env,
    ready: rows.length > 0
  };
});

console.log(JSON.stringify({ limitPerInput: limit, urlsPerPlatform, selectedPlatforms: Array.from(selectedPlatforms), outputs }, null, 2));

function readUrlsFromJson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const rows = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => row?.url || row?.post_url || row?.input_url)
    .filter((url) => typeof url === "string" && url.trim());
}