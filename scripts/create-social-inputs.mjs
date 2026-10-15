import fs from "node:fs";
import path from "node:path";
import { envEnabled, envList, loadEnv, optionalEnv } from "./env.mjs";

loadEnv();

const outputDir = path.join(process.cwd(), "work", "inputs");
fs.mkdirSync(outputDir, { recursive: true });

const common = {
  language: optionalEnv("SOCIAL_LANGUAGE"),
  country: optionalEnv("SOCIAL_COUNTRY"),
  start_date: optionalEnv("SOCIAL_PERIOD_FROM"),
  end_date: optionalEnv("SOCIAL_PERIOD_TO")
};
const tiktokCountry = optionalEnv("SOCIAL_COUNTRY", "TH").trim().toUpperCase() || "TH";
const includeContextFields = envEnabled("SOCIAL_INCLUDE_CONTEXT_FIELDS", false);
const includeInputType = envEnabled("SOCIAL_INCLUDE_INPUT_TYPE", false);

const tiktokSearchInput = envEnabled("SOCIAL_TIKTOK_ENABLED")
  ? [
      ...itemsFromList("SOCIAL_TIKTOK_KEYWORDS", optionalEnv("BRIGHT_DATA_TIKTOK_SEARCH_INPUT_FIELD", "keyword"), "keyword"),
      ...itemsFromList("SOCIAL_TIKTOK_HASHTAGS", optionalEnv("BRIGHT_DATA_TIKTOK_HASHTAG_INPUT_FIELD", "keyword"), "hashtag")
    ].map((item) => ({ ...item, country: tiktokCountry }))
  : [];

const tiktokCommentsInput = envEnabled("SOCIAL_TIKTOK_ENABLED")
  ? itemsFromList("SOCIAL_TIKTOK_URLS", optionalEnv("BRIGHT_DATA_TIKTOK_URL_INPUT_FIELD", "url"), "url")
  : [];

const xInput = envEnabled("SOCIAL_X_ENABLED", false)
  ? [
      ...itemsFromList("SOCIAL_X_QUERIES", optionalEnv("BRIGHT_DATA_X_QUERY_INPUT_FIELD", "keyword"), "query"),
      ...itemsFromList("SOCIAL_X_HASHTAGS", optionalEnv("BRIGHT_DATA_X_HASHTAG_INPUT_FIELD", "hashtag"), "hashtag")
    ]
  : [];

const outputs = [
  writeInput("tiktok-search.json", tiktokSearchInput),
  writeInput("tiktok-comments.json", tiktokCommentsInput),
  writeInput("x-posts.json", xInput)
];

console.log(
  JSON.stringify(
    {
      topic: optionalEnv("SOCIAL_TOPIC_SLUG", "social-report"),
      outputDir: path.relative(process.cwd(), outputDir),
      outputs
    },
    null,
    2
  )
);

function itemsFromList(envKey, fieldName, inputType) {
  return envList(envKey).map((value) => stripEmpty({
    [fieldName]: value,
    ...(includeInputType ? { input_type: inputType } : {}),
    ...(includeContextFields ? common : {})
  }));
}

function writeInput(fileName, rows) {
  const outputPath = path.join(outputDir, fileName);
  fs.writeFileSync(outputPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  return {
    file: path.relative(process.cwd(), outputPath),
    rows: rows.length
  };
}

function stripEmpty(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== "" && entry !== null && entry !== undefined)
  );
}

function numberOrNull(value) {
  if (!value || Number.isNaN(Number(value))) return null;
  return Number(value);
}
