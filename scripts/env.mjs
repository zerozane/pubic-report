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
    "instagram-hashtag": "BRIGHT_DATA_INSTAGRAM_HASHTAG_DATASET_ID",
    "instagram-comments": "BRIGHT_DATA_INSTAGRAM_COMMENTS_DATASET_ID"
  };
  const envKey = map[name];
  if (!envKey) {
    throw new Error(`Unknown dataset "${name}". Use: ${Object.keys(map).join(", ")}`);
  }
  return requireEnv(envKey);
}
