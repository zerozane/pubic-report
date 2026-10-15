import fs from "node:fs";
import path from "node:path";

export function loadEnv() {
  for (const fileName of [".env", ".env.local"]) {
    const filePath = path.join(process.cwd(), fileName);
    if (!fs.existsSync(filePath)) continue;

    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  }
}

export function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export function getDatasetId(name) {
  const map = {
    "tiktok-search": "BRIGHT_DATA_TIKTOK_SEARCH_DATASET_ID",
    "tiktok-comments": "BRIGHT_DATA_TIKTOK_COMMENTS_DATASET_ID",
    "x-posts": "BRIGHT_DATA_X_POSTS_DATASET_ID",
    "twitter-posts": "BRIGHT_DATA_X_POSTS_DATASET_ID",
    "x-comments": "BRIGHT_DATA_X_COMMENTS_DATASET_ID",
    "twitter-comments": "BRIGHT_DATA_X_COMMENTS_DATASET_ID",
    "instagram-posts": "BRIGHT_DATA_INSTAGRAM_POSTS_DATASET_ID",
    "instagram-hashtag": "BRIGHT_DATA_INSTAGRAM_HASHTAG_DATASET_ID",
    "instagram-comments": "BRIGHT_DATA_INSTAGRAM_COMMENTS_DATASET_ID",
    "facebook-posts": "BRIGHT_DATA_FACEBOOK_POSTS_DATASET_ID",
    "facebook-comments": "BRIGHT_DATA_FACEBOOK_COMMENTS_DATASET_ID",
    "youtube-videos": "BRIGHT_DATA_YOUTUBE_VIDEOS_DATASET_ID",
    "youtube-comments": "BRIGHT_DATA_YOUTUBE_COMMENTS_DATASET_ID",
  };
  const envKey = map[name];
  if (!envKey) {
    throw new Error(`Unknown dataset "${name}". Use: ${Object.keys(map).join(", ")}`);
  }
  return requireEnv(envKey);
}

export function envList(key) {
  const value = process.env[key];
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function optionalEnv(key, fallback = "") {
  return process.env[key] || fallback;
}

export function optionalNumberEnv(key, fallback = null) {
  const value = process.env[key];
  if (!value || Number.isNaN(Number(value))) return fallback;
  return Number(value);
}

export function envEnabled(key, fallback = true) {
  const value = process.env[key];
  if (value === undefined || value === "") return fallback;
  return !["0", "false", "no", "off"].includes(value.toLowerCase());
}

export function getDefaultLimitPerInput(dataset) {
  const map = {
    "tiktok-search": "SOCIAL_TIKTOK_VIDEO_LIMIT",
    "tiktok-comments": "SOCIAL_TIKTOK_COMMENTS_PER_VIDEO",
    "x-posts": "SOCIAL_X_POST_LIMIT",
    "twitter-posts": "SOCIAL_X_POST_LIMIT",
    "x-comments": "SOCIAL_X_COMMENTS_PER_POST",
    "twitter-comments": "SOCIAL_X_COMMENTS_PER_POST",
    "instagram-posts": "SOCIAL_INSTAGRAM_POST_LIMIT",
    "instagram-comments": "SOCIAL_INSTAGRAM_COMMENTS_PER_POST",
    "facebook-posts": "SOCIAL_FACEBOOK_POST_LIMIT",
    "facebook-comments": "SOCIAL_FACEBOOK_COMMENTS_PER_POST",
    "youtube-comments": "SOCIAL_YOUTUBE_COMMENTS_PER_VIDEO",
  };
  const envKey = map[dataset];
  return envKey ? optionalNumberEnv(envKey) : null;
}

export function getSafeLimitPerInput(dataset, requested = null) {
  const max = optionalNumberEnv("BRIGHT_DATA_MAX_LIMIT_PER_INPUT", 10);
  const configured = requested ?? getDefaultLimitPerInput(dataset) ?? optionalNumberEnv("BRIGHT_DATA_DEFAULT_LIMIT_PER_INPUT", 5);
  const value = Number(configured);

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Invalid limit_per_input for ${dataset}: ${configured}. Use a positive integer.`);
  }
  if (!Number.isInteger(max) || max < 1) {
    throw new Error(`Invalid BRIGHT_DATA_MAX_LIMIT_PER_INPUT: ${max}. Use a positive integer.`);
  }

  return Math.min(value, max);
}

export function assertCollectionBudget(dataset, inputCount, limitPerInput) {
  const maxTotal = optionalNumberEnv("BRIGHT_DATA_MAX_TOTAL_RECORDS", 100);
  if (!Number.isInteger(maxTotal) || maxTotal < 1) {
    throw new Error(`Invalid BRIGHT_DATA_MAX_TOTAL_RECORDS: ${maxTotal}. Use a positive integer.`);
  }
  const estimatedTotal = inputCount * limitPerInput;
  if (estimatedTotal > maxTotal) {
    throw new Error(
      `Refusing ${dataset} collection: ${inputCount} inputs x ${limitPerInput} records = ${estimatedTotal}. Maximum is ${maxTotal}. Split the job or lower the limit.`
    );
  }
}

export function prepareDatasetInput(dataset, input) {
  if (!Array.isArray(input)) {
    throw new Error("Bright Data input must be a JSON array.");
  }

  const maxInputs = optionalNumberEnv("BRIGHT_DATA_MAX_INPUTS", 20);
  if (!Number.isInteger(maxInputs) || maxInputs < 1) {
    throw new Error(`Invalid BRIGHT_DATA_MAX_INPUTS: ${maxInputs}. Use a positive integer.`);
  }
  if (input.length > maxInputs) {
    throw new Error(`Refusing to submit ${input.length} inputs. Maximum is ${maxInputs}. Split the collection into smaller jobs.`);
  }

  if (dataset !== "tiktok-search") return input;

  const country = optionalEnv("SOCIAL_COUNTRY", "TH").trim().toUpperCase() || "TH";
  return input.map((item) => {
    const itemCountry = typeof item?.country === "string" ? item.country.trim().toUpperCase() : "";
    return { ...item, country: itemCountry || country };
  });
}
