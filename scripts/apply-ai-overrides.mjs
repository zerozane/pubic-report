import fs from "node:fs";

const reportPath = "data/reports/iphone-18-selected-tiktok.json";
const overridesPath = "work/review/iphone18-ai-manual-overrides.json";
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const overrides = JSON.parse(fs.readFileSync(overridesPath, "utf8"));
let applied = 0;

for (const item of report.evidence) {
  const override = overrides[item.id];
  if (!override) continue;
  item.sentiment = override.sentiment;
  item.topics = override.topics;
  item.review = {
    method: "ai-manual-override",
    reason: override.reason,
  };
  applied += 1;
}

report.methodology = {
  ...report.methodology,
  sentimentMethod:
    "จัดประเภทด้วยกฎเบื้องต้น แล้วไล่อ่าน high-priority text groups ด้วย AI/manual review พร้อม override ราย ID",
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ reportPath, overrides: Object.keys(overrides).length, applied }, null, 2));
