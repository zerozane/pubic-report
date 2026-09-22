export type Platform = "TikTok" | "Instagram";
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
