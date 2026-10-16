import fs from "node:fs";
import path from "node:path";
import { loadEnv, optionalEnv, requireEnv } from "./env.mjs";

loadEnv();

const args = parseArgs(process.argv.slice(2));
const inputPath = String(args.input || "data/inputs/laglace-shopee-products.json");
const outputPath = String(args.output || "work/raw/laglace-shopee-reviews.json");
const input = readInput(inputPath);
const mode = String(args.mode || input.mode || (input.shopUrls ? "shop" : "product")).toLowerCase();
const catalogPath = String(args.catalog || input.catalog || inputPath);
const actorId = mode === "shop"
  ? optionalEnv("APIFY_SHOPEE_SHOP_ACTOR_ID", "dami_studio/shopee-shop-reviews-scraper")
  : optionalEnv("APIFY_SHOPEE_PRODUCT_ACTOR_ID", "zen-studio/shopee-product-reviews-scraper");
const token = requireEnv("APIFY_API_TOKEN");
const products = input.products;
const startUrls = input.startUrls;
const maxReviews = args["full-history"] ? (mode === "shop" ? 5000 : 0) : Number(args["max-reviews"] ?? (mode === "shop" ? 300 : 1000));
const starFilter = String(args["star-filter"] ?? "all");
const contentFilter = String(args["content-filter"] ?? "all");
const pollSeconds = Number(args["poll-seconds"] ?? 10);
const maxWaitMinutes = Number(args["max-wait-minutes"] ?? 30);

if (!["product", "shop"].includes(mode)) throw new Error("--mode must be product or shop.");
if (!Number.isInteger(maxReviews) || maxReviews < 0 || (mode === "shop" && maxReviews > 5000)) {
  throw new Error(mode === "shop"
    ? "--max-reviews must be an integer from 0 to 5000. Use --full-history for 0."
    : "--max-reviews must be a non-negative integer. Use --full-history for 0.");
}
if (!["all", "1", "2", "3", "4", "5"].includes(starFilter)) {
  throw new Error("--star-filter must be all, 1, 2, 3, 4, or 5.");
}
if (!["all", "with comments", "with media", "local"].includes(contentFilter)) {
  throw new Error("--content-filter must be all, with comments, with media, or local.");
}

const actorPath = actorId.replace("/", "~");
const startResponse = await fetch(`https://api.apify.com/v2/acts/${encodeURIComponent(actorPath)}/runs`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(mode === "shop"
    ? {
      startUrls,
      maxReviewsPerShop: maxReviews,
      starRatings: starFilter === "all" ? ["5", "4", "3", "2", "1"] : [starFilter],
      onlyWithText: contentFilter === "with comments",
      onlyWithMedia: contentFilter === "with media",
      includeShopSummary: true,
    }
    : {
      startUrls: products.map((product) => ({ url: product.url })),
      maxReviewsPerProduct: maxReviews,
      starFilter,
      contentFilter,
    }),
  signal: AbortSignal.timeout(90000),
});

const startBody = await readJsonResponse(startResponse, "start Apify Shopee run");
const run = startBody.data || startBody;
const runId = run.id;
if (!runId) throw new Error("Apify did not return a run ID.");

console.log(`Shopee run: ${runId}`);
console.log(`${mode === "shop" ? "shops" : "products"}: ${mode === "shop" ? startUrls.length : products.length}`);
console.log(`max reviews per ${mode}: ${maxReviews === 0 ? "full history" : maxReviews}`);
console.log(`filters: star=${starFilter}, content=${contentFilter}`);

const completedRun = await waitForRun(runId, token, { pollSeconds, maxWaitMinutes });
const datasetId = completedRun.defaultDatasetId;
if (!datasetId) throw new Error("Apify run completed without a default dataset ID.");

const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId)}/items?clean=true&format=json`, {
  headers: { Authorization: `Bearer ${token}` },
  signal: AbortSignal.timeout(90000),
});
const rows = await readJsonResponse(datasetResponse, "download Shopee dataset");
if (!Array.isArray(rows)) throw new Error("Shopee dataset response is not an array.");

const outputFullPath = path.resolve(outputPath);
fs.mkdirSync(path.dirname(outputFullPath), { recursive: true });
fs.writeFileSync(outputFullPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");

const catalogOutputPath = path.resolve(outputFullPath, "..", `${path.basename(outputFullPath, path.extname(outputFullPath))}-catalog.json`);
fs.writeFileSync(catalogOutputPath, `${JSON.stringify(readCatalog(catalogPath), null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  actorId,
  mode,
  runId,
  datasetId,
  rows: rows.length,
  reviews: rows.filter((row) => row?.type !== "shop").length,
  shopSummaries: rows.filter((row) => row?.type === "shop").length,
  outputPath,
  catalogOutputPath,
}, null, 2));

async function waitForRun(id, apiToken, options) {
  const deadline = Date.now() + options.maxWaitMinutes * 60 * 1000;
  let lastStatus = "";
  while (Date.now() < deadline) {
    const response = await fetch(`https://api.apify.com/v2/actor-runs/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
      signal: AbortSignal.timeout(30000),
    });
    const body = await readJsonResponse(response, "check Apify Shopee run");
    const current = body.data || body;
    if (current.status !== lastStatus) {
      console.log(`run status: ${current.status}`);
      lastStatus = current.status;
    }
    if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(current.status)) {
      if (current.status !== "SUCCEEDED") throw new Error(`Apify Shopee run ${current.status}. Run ID: ${id}`);
      return current;
    }
    await new Promise((resolve) => setTimeout(resolve, options.pollSeconds * 1000));
  }
  throw new Error(`Timed out waiting for Apify Shopee run ${id}.`);
}

function readInput(filePath) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) throw new Error(`Shopee input not found: ${fullPath}`);
  const value = JSON.parse(fs.readFileSync(fullPath, "utf8").replace(/^\uFEFF/, ""));
  if (Array.isArray(value)) {
    validateProducts(value);
    return { mode: "product", products: value, startUrls: [] };
  }
  if (!value || typeof value !== "object") throw new Error("Shopee input must be a JSON array or an object with shopUrls.");
  const urls = value.shopUrls || value.startUrls;
  if (!Array.isArray(urls) || !urls.length) throw new Error("Shopee shop input must include a non-empty shopUrls array.");
  for (const entry of urls) {
    const url = typeof entry === "string" ? entry : entry?.url;
    if (!url || !/^https:\/\/shopee\.[^/]+\//i.test(url)) {
      throw new Error(`Invalid Shopee URL: ${url || "(missing)"}. Expected a Shopee shop or product URL.`);
    }
  }
  return {
    mode: "shop",
    products: [],
    startUrls: urls.map((entry) => typeof entry === "string" ? entry : entry.url),
    catalog: value.catalog,
  };
}

function validateProducts(value) {
  if (!value.length) throw new Error("Shopee product input must be a non-empty JSON array.");
  for (const product of value) {
    if (!product?.url || !/-i\.\d+\.\d+/i.test(product.url)) {
      throw new Error(`Invalid Shopee product URL: ${product?.url || "(missing)"}. Expected -i.<shopId>.<itemId>.`);
    }
  }
}

function readCatalog(filePath) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) throw new Error(`Shopee catalog not found: ${fullPath}`);
  const value = JSON.parse(fs.readFileSync(fullPath, "utf8").replace(/^\uFEFF/, ""));
  if (!Array.isArray(value)) throw new Error("Shopee catalog must be a product JSON array.");
  validateProducts(value);
  return value;
}

async function readJsonResponse(response, operation) {
  const text = await response.text();
  if (!response.ok) throw new Error(`Failed to ${operation}: ${response.status} ${text.slice(0, 500)}`);
  try {
    return JSON.parse(text || "null");
  } catch {
    throw new Error(`Failed to ${operation}: response was not valid JSON.`);
  }
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
