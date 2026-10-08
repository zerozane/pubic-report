import fs from "node:fs";
import path from "node:path";
import { parseArgs, printUsage } from "./args.mjs";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.input) {
  printUsage("Prepare normalized TikTok/X evidence for Jev batch classification", [
    "npm run jev:prepare -- --input work/reviewed/tiktok-draft.json,work/reviewed/x-draft.json",
    "optional: --output work/jev/social-listening-input.jsonl",
    "optional: --questions work/jev/social-listening-questions.json",
    "optional: --limit 100"
  ]);
  process.exit(args.help ? 0 : 1);
}

const inputPaths = String(args.input)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)
  .map((value) => path.resolve(process.cwd(), value));

const outputPath = path.resolve(process.cwd(), String(args.output ?? "work/jev/social-listening-input.jsonl"));
const questionsPath = path.resolve(process.cwd(), String(args.questions ?? "work/jev/social-listening-questions.json"));
const limit = args.limit ? Number(args.limit) : null;

const rows = [];
for (const inputPath of inputPaths) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${path.relative(process.cwd(), inputPath)}`);
  }

  const parsed = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed.evidence) ? parsed.evidence : [parsed];
  for (const item of items) {
    const row = toJevRow(item);
    if (row.text) rows.push(row);
  }
}

const deduped = dedupeRows(rows);
const selectedRows = limit ? deduped.slice(0, limit) : deduped;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.mkdirSync(path.dirname(questionsPath), { recursive: true });
fs.writeFileSync(outputPath, `${selectedRows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
fs.writeFileSync(questionsPath, `${JSON.stringify(buildQuestions(), null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      inputs: inputPaths.map((filePath) => path.relative(process.cwd(), filePath)),
      output: path.relative(process.cwd(), outputPath),
      questions: path.relative(process.cwd(), questionsPath),
      rows: selectedRows.length,
      duplicatesRemoved: rows.length - deduped.length
    },
    null,
    2
  )
);

function toJevRow(item) {
  const metrics = item.metrics || {};
  const matchedKeywords = item.matchedKeywords || item.topics || [];

  return stripEmpty({
    id: item.id,
    platform: item.platform,
    source_type: item.recordType || "comment",
    discovery_type: inferDiscoveryType(matchedKeywords),
    discovery_term: matchedKeywords[0] || "",
    text: cleanText(item.text),
    post_text: cleanText(item.postText || item.parentText || ""),
    current_sentiment: item.sentiment || "",
    current_topics: Array.isArray(item.topics) ? item.topics.join("|") : "",
    matched_keywords: Array.isArray(matchedKeywords) ? matchedKeywords.join("|") : "",
    metrics_likes: metrics.likes ?? item.engagement ?? "",
    metrics_replies: metrics.replies ?? "",
    metrics_shares: metrics.shares ?? "",
    metrics_views: metrics.views ?? "",
    author_handle: item.user || item.authorName || "",
    source_url: item.sourceUrl || "",
    published_at: item.publishedAt || ""
  });
}

function buildQuestions() {
  return {
    name: "social-listening-thai-tiktok-x-v1",
    description:
      "Classify Thai social listening rows from TikTok and X for the dashboard. Prefer explicit evidence in the text. Use unclear/neutral when intent is not written.",
    inputFormat: "JSONL; each line is one object with id, platform, text, metrics, keywords, and source metadata.",
    outputFields: [
      {
        name: "is_relevant",
        type: "yes_no",
        question: "Is this text relevant to the tracked brand/product/topic?"
      },
      {
        name: "is_spam_or_noise",
        type: "yes_no",
        question: "Is this spam, pure tag noise, empty emoji-only content, bot-like text, or unrelated chatter?"
      },
      {
        name: "language",
        type: "choice",
        options: ["thai", "english", "mixed", "other", "unclear"]
      },
      {
        name: "sentiment",
        type: "choice",
        options: ["positive", "neutral", "negative", "unclear"],
        question: "Classify attitude toward the brand/product/topic, not just emotional tone."
      },
      {
        name: "consumer_intent",
        type: "choice",
        options: [
          "purchase_intent",
          "product_review",
          "question",
          "complaint",
          "issue_report",
          "brand_trust",
          "joke_or_sarcasm",
          "news_or_info",
          "noise",
          "other"
        ]
      },
      {
        name: "purchase_intent",
        type: "yes_no",
        question: "Does the text say the user wants to buy, plans to buy, tried to buy, waits to buy, or avoids buying?"
      },
      {
        name: "issue_flag",
        type: "yes_no",
        question: "Does this mention a problem the brand should monitor or respond to?"
      },
      {
        name: "primary_pillar",
        type: "choice",
        options: [
          "design_packaging",
          "product_quality",
          "price_value",
          "availability",
          "brand_trust",
          "fake_product",
          "influencer_review",
          "customer_service",
          "campaign_viral",
          "noise",
          "other"
        ]
      },
      {
        name: "evidence_strength",
        type: "score_0_5",
        question: "How useful is this row as evidence in a social listening report?"
      },
      {
        name: "recommended_action",
        type: "choice",
        options: ["amplify", "monitor", "respond", "fix_supply", "fix_product", "clarify_trust", "ignore"]
      },
      {
        name: "needs_human_review",
        type: "yes_no",
        question: "Should a human review this label because it is ambiguous, sarcastic, high-impact, or potentially risky?"
      },
      {
        name: "confidence",
        type: "score_0_1",
        question: "Confidence in the overall classification."
      }
    ],
    reviewRules: [
      "Send rows with confidence below 0.7 to human review.",
      "Send high-engagement negative rows to human review even when confidence is high.",
      "Do not infer purchase intent unless buying, waiting, trying, avoiding, or asking to buy is stated.",
      "Treat sarcasm and jokes as useful evidence only when they clearly express consumer perception."
    ]
  };
}

function dedupeRows(rows) {
  const seen = new Set();
  const result = [];
  for (const row of rows) {
    const key = `${row.platform}:${row.text.toLocaleLowerCase("th").replace(/\s+/g, " ").trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(row);
  }
  return result;
}

function inferDiscoveryType(keywords) {
  const first = Array.isArray(keywords) ? keywords[0] : "";
  if (String(first).startsWith("#")) return "hashtag";
  return first ? "keyword" : "";
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripEmpty(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== "" && entry !== null && entry !== undefined)
  );
}
