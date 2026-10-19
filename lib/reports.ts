import fs from "node:fs";
import path from "node:path";
import type { Platform, Report, ReportSummary, Sentiment } from "./types";
export { getSentimentLabel } from "./format";

const reportsDirectory = path.join(process.cwd(), "data", "reports");

const laglaceSignalPattern = /\blaglace\b|@laglace|ลากลาส|ลากลาซ/i;
const laglacePhrasePattern = /\bla\s+glace\b/i;
const officialLaglaceXSourcePattern = /\/LaglaceTH_(?:\/|$)|\/laglace_official(?:\/|$)/i;
const competingBrandPattern = /canmake|browit|4u2|hince|mude|mizumi|kage|odbo|clio|lilybyred|dasique|lifeford|heart\s*percent|j\s*m\s*c\s*y|jmcy|melinda|in2it|เมอลินดา|เมลินดา/i;

function hasLaGlaceSignal(item: Report["evidence"][number]) {
  const text = [
    item.text,
    ...(item.matchedKeywords ?? []),
    item.sourceUrl ?? ""
  ].join(" ");
  const hasBrandPhrase = laglacePhrasePattern.test(text) && /official|product|beauty|lip|blush|toner|ลิป|บลัช|โทนเนอร์/i.test(text);
  return laglaceSignalPattern.test(text) || hasBrandPhrase;
}

function isLaGlaceEvidence(item: Report["evidence"][number]) {
  const text = [item.text, ...(item.matchedKeywords ?? [])].join(" ");
  const hasCompetingBrand = competingBrandPattern.test(text);
  const hasBrandSignal = hasLaGlaceSignal({ ...item, sourceUrl: null });

  if (item.platform === "X") {
    return (hasBrandSignal || officialLaglaceXSourcePattern.test(item.sourceUrl ?? "")) && !hasCompetingBrand;
  }

  return !hasCompetingBrand || hasBrandSignal;
}

function applyReportQualityFilters(report: Report, slug: string) {
  if (slug !== "laglace-clean-social-report") {
    return report;
  }

  const evidence = report.evidence.filter(isLaGlaceEvidence);
  const retainedEvidenceIds = new Set(evidence.map((item) => item.id));

  return {
    ...report,
    evidence,
    insights: report.insights.map((insight) => ({
      ...insight,
      evidenceIds: insight.evidenceIds.filter((id) => retainedEvidenceIds.has(id))
    }))
  };
}

export function getReportSlugs() {
  if (!fs.existsSync(reportsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(reportsDirectory)
    // Product-quality summaries (*-product-quality.json) share this folder but are not reports.
    .filter((file) => file.endsWith(".json") && !file.endsWith("-product-quality.json"))
    .map((file) => file.replace(/\.json$/, ""));
}

export function getAllReports() {
  return getReportSlugs()
    .map(getReportBySlug)
    .sort((left, right) => (right.collectedAt ?? "").localeCompare(left.collectedAt ?? ""));
}

export function getReportBySlug(slug: string): Report {
  const filePath = path.join(reportsDirectory, `${slug}.json`);
  const raw = fs.readFileSync(filePath, "utf8");
  return applyReportQualityFilters(JSON.parse(raw) as Report, slug);
}

export function getPlatformSummary(report: Report): ReportSummary {
  const totalRecords = report.evidence.length;
  const postCount = report.evidence.filter((item) => item.recordType === "post").length;
  const comments = report.evidence.filter((item) => item.recordType === "comment");
  const classifiedComments = comments.filter((item) => item.sentiment !== null);
  const positiveCount = classifiedComments.filter((item) => item.sentiment === "positive").length;
  const neutralCount = classifiedComments.filter((item) => item.sentiment === "neutral").length;
  const negativeCount = classifiedComments.filter((item) => item.sentiment === "negative").length;
  const positivePercent = classifiedComments.length
    ? Math.round((positiveCount / classifiedComments.length) * 100)
    : null;

  const platformNames = Array.from(new Set(report.evidence.map((item) => item.platform))).filter(Boolean) as Platform[];
  const platforms = platformNames.map((platform) => {
    const records = report.evidence.filter((item) => item.platform === platform);
    return {
      platform,
      total: records.length,
      posts: records.filter((item) => item.recordType === "post").length,
      comments: records.filter((item) => item.recordType === "comment").length,
      percent: totalRecords ? Math.round((records.length / totalRecords) * 100) : 0
    };
  });

  const dailyMap = new Map<string, { total: number; posts: number; comments: number }>();
  for (const item of report.evidence) {
    if (!item.publishedAt || Number.isNaN(Date.parse(item.publishedAt))) continue;
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: report.period.timezone, year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date(item.publishedAt));
    const part = (type: string) => parts.find((entry) => entry.type === type)?.value;
    const date = `${part("year")}-${part("month")}-${part("day")}`;
    const current = dailyMap.get(date) ?? { total: 0, posts: 0, comments: 0 };
    current.total += 1;
    if (item.recordType === "post") current.posts += 1;
    if (item.recordType === "comment") current.comments += 1;
    dailyMap.set(date, current);
  }

  const daily = Array.from(dailyMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, counts]) => ({ date, ...counts }));

  const peakDay = daily.length
    ? daily.reduce((peak, current) => (current.total > peak.total ? current : peak), daily[0])
    : null;

  return {
    totalRecords,
    postCount,
    commentCount: comments.length,
    classifiedComments: classifiedComments.length,
    positiveCount,
    neutralCount,
    negativeCount,
    positivePercent,
    platforms,
    daily,
    peakDay
  };
}
