import type { Sentiment } from "./types";

export function formatReportDate(value: string | null, timezone = "Asia/Bangkok") {
  if (!value || Number.isNaN(Date.parse(value))) return "ยังไม่กำหนด";

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(value));
}

export function getSentimentLabel(sentiment: Sentiment | null) {
  if (sentiment === "positive") return "เชิงบวก";
  if (sentiment === "negative") return "เชิงลบ";
  if (sentiment === "neutral") return "เป็นกลาง";
  return "ยังไม่จัดประเภท";
}
