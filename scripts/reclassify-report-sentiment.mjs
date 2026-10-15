import fs from "node:fs";
import path from "node:path";
import { classifySocialSentiment, sentimentStandardMethod } from "./sentiment-rules.mjs";

const reportsDirectory = path.resolve(process.cwd(), "data", "reports");
const reportFiles = fs.readdirSync(reportsDirectory)
  .filter((file) => file.endsWith(".json"))
  .filter((file) => file !== "laglace-product-quality.json");

const results = [];
for (const fileName of reportFiles) {
  const filePath = path.join(reportsDirectory, fileName);
  const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let changed = 0;
  let classified = 0;
  const counts = { positive: 0, neutral: 0, negative: 0 };

  for (const item of report.evidence || []) {
    if (item.recordType !== "comment") continue;
    const sentiment = classifySocialSentiment(item.text, {
      domain: fileName.includes("iphone") ? "iphone" : "laglace",
    });
    if (item.sentiment !== sentiment || item.isIssue !== (sentiment === "negative")) changed += 1;
    item.sentiment = sentiment;
    item.isIssue = sentiment === "negative";
    counts[sentiment] += 1;
    classified += 1;
  }

  report.methodology = {
    ...report.methodology,
    sentimentMethod: sentimentStandardMethod,
  };
  fs.writeFileSync(filePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  results.push({ file: fileName, changed, classified, counts });
}

console.log(JSON.stringify(results, null, 2));
