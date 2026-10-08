export type Platform = "TikTok" | "Instagram" | "X" | "Facebook" | "YouTube";
export type Sentiment = "positive" | "neutral" | "negative";
export type RecordType = "post" | "comment";
export type InsightType = "strength" | "concern" | "opportunity";

export type ReportEvidence = {
  id: string;
  platform: Platform;
  recordType: RecordType;
  sourceId: string | null;
  parentPostId: string | null;
  sourceUrl: string | null;
  publishedAt: string;
  text: string;
  sentiment: Sentiment | null;
  topics: string[];
  metrics: {
    likes?: number | null;
    replies?: number | null;
    shares?: number | null;
    views?: number | null;
    comments?: number | null;
  };
  isDemo?: boolean;
  user?: string;
  authorName?: string;
  matchedKeywords?: string[];
  intent?: string;
  engagement?: number;
  isIssue?: boolean;
  detail?: string;
  sentimentScore?: number;
};

export type DashboardKpi = {
  label: string;
  value: string;
  caption: string;
  badge?: string;
  tone?: "pink" | "mint" | "red" | "slate";
};

export type DashboardSource = {
  name: string;
  type: string;
  status: string;
  ping?: string;
  count: string;
  platform: Platform;
};

export type DashboardKeyword = {
  tag: string;
  count: number;
  percentage: number;
  color?: string;
};

export type DashboardPillar = {
  title: string;
  share: number;
  positive: number;
  description: string;
  keywords: string[];
  takeaway: string;
};

export type DashboardEventPin = {
  index: number;
  label: string;
  description: string;
  color?: string;
};

export type DashboardConfig = {
  eyebrow: string;
  headline: string;
  description: string;
  brandMark: string;
  brandName: string;
  badge: string;
  kpis: DashboardKpi[];
  ingestion: {
    statusText: string;
    window: string;
    pipelineSpeed: string;
    dataFreshness: string;
    monitoredKeywords: string[];
    connectedSources: DashboardSource[];
    topKeywords: DashboardKeyword[];
  };
  timeline: {
    labels: string[];
    total: number[];
    positive: number[];
    negative: number[];
    events: DashboardEventPin[];
  };
  pillars: DashboardPillar[];
};

export type ReportInsight = {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  evidenceIds: string[];
  recommendation: string;
};

export type Report = {
  slug: string;
  title: string;
  status: "demo" | "draft" | "published";
  author: string;
  period: {
    from: string;
    to: string;
    timezone: string;
  };
  collectedAt: string | null;
  summary: string;
  methodology: {
    source: string;
    selection: string;
    sentimentMethod: string;
    limitations: string[];
  };
  insights: ReportInsight[];
  evidence: ReportEvidence[];
  dashboard?: DashboardConfig;
};

export type ReportSummary = {
  totalRecords: number;
  postCount: number;
  commentCount: number;
  classifiedComments: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  positivePercent: number | null;
  platforms: Array<{
    platform: Platform;
    total: number;
    posts: number;
    comments: number;
    percent: number;
  }>;
  daily: Array<{
    date: string;
    total: number;
    posts: number;
    comments: number;
  }>;
  peakDay: {
    date: string;
    total: number;
  } | null;
};
