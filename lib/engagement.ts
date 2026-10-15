import type { ReportEvidence } from "./types";

export function getInteractionTotal(item: ReportEvidence) {
  const metrics = item.metrics || {};
  return toNumber(metrics.likes) + toNumber(metrics.comments ?? metrics.replies) + toNumber(metrics.shares);
}

function toNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}
