import fs from "node:fs";

const envPath = "scripts/env.mjs";
let envSource = fs.readFileSync(envPath, "utf8");

envSource = envSource.replace(
  `    "x-posts": "BRIGHT_DATA_X_POSTS_DATASET_ID",
    "twitter-posts": "BRIGHT_DATA_X_POSTS_DATASET_ID",
    "instagram-hashtag": "BRIGHT_DATA_INSTAGRAM_HASHTAG_DATASET_ID",
    "instagram-comments": "BRIGHT_DATA_INSTAGRAM_COMMENTS_DATASET_ID"`,
  `    "x-posts": "BRIGHT_DATA_X_POSTS_DATASET_ID",
    "twitter-posts": "BRIGHT_DATA_X_POSTS_DATASET_ID",
    "x-comments": "BRIGHT_DATA_X_COMMENTS_DATASET_ID",
    "twitter-comments": "BRIGHT_DATA_X_COMMENTS_DATASET_ID",
    "instagram-hashtag": "BRIGHT_DATA_INSTAGRAM_HASHTAG_DATASET_ID",
    "instagram-comments": "BRIGHT_DATA_INSTAGRAM_COMMENTS_DATASET_ID",
    "facebook-comments": "BRIGHT_DATA_FACEBOOK_COMMENTS_DATASET_ID"`
);

envSource = envSource.replace(
  `    "x-posts": "SOCIAL_X_POST_LIMIT",
    "twitter-posts": "SOCIAL_X_POST_LIMIT"`,
  `    "x-posts": "SOCIAL_X_POST_LIMIT",
    "twitter-posts": "SOCIAL_X_POST_LIMIT",
    "x-comments": "SOCIAL_X_COMMENTS_PER_POST",
    "twitter-comments": "SOCIAL_X_COMMENTS_PER_POST",
    "instagram-comments": "SOCIAL_INSTAGRAM_COMMENTS_PER_POST",
    "facebook-comments": "SOCIAL_FACEBOOK_COMMENTS_PER_POST"`
);

fs.writeFileSync(envPath, envSource);

const demoPath = "data/reports/laglace-social-report.json";
const report = JSON.parse(fs.readFileSync(demoPath, "utf8"));
report.methodology.source = report.methodology.source.replace("YouTube", "Facebook");

if (report.dashboard?.ingestion?.connectedSources) {
  for (const source of report.dashboard.ingestion.connectedSources) {
    if (source.platform === "YouTube") source.platform = "Facebook";
    if (source.name === "YouTube Data API") source.name = "Facebook Graph / Comments";
    if (typeof source.type === "string" && source.type.includes("Video")) {
      source.type = "Posts & public comments";
    }
  }
}

for (const item of report.evidence || []) {
  if (item.platform === "YouTube") item.platform = "Facebook";
}

fs.writeFileSync(demoPath, `${JSON.stringify(report, null, 2)}\n`);
console.log("updated 4-platform config");
