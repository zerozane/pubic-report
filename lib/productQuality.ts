import fs from "node:fs";
import path from "node:path";

export type ProductQualityTopic = {
  name: string;
  count: number;
  negative: number;
  percent: number;
  products: string[];
};

export type ProductQualityProduct = {
  id: string;
  name: string;
  sourceName: string;
  label: string;
  category: string;
  count: number;
  averageRating: number | null;
  fiveStarPercent: number;
  lowRatingPercent: number;
  verifiedPercent: number;
  ratingDistribution: Array<{ rating: number; count: number }>;
  issueCount: number;
  topics: Array<{ name: string; count: number; percent: number }>;
};

export type ProductQualityEvidence = {
  id: string;
  productId: string;
  productName: string;
  category: string;
  text: string;
  rating: number | null;
  sku: string | null;
  sentiment: "positive" | "neutral" | "negative";
  topics: string[];
  issues: string[];
  verifiedPurchase: boolean;
  reviewCountry: string | null;
  productUrl: string | null;
};

export type ProductQualityReview = {
  id: string;
  productId: string;
  productName: string;
  sourceName: string;
  productLabel: string;
  productCategory: string;
  sku: string | null;
  rating: number | null;
  sentiment: "positive" | "neutral" | "negative";
  reviewText: string;
  reviewCountry: string | null;
  verifiedPurchase: boolean;
  incentivizedReview: boolean;
  reviewTime: string | null;
  productUrl: string | null;
  qualityTopics: string[];
  qualityIssues: string[];
  experienceType: string;
  isIssue: boolean;
  needsHumanReview: boolean;
};

export type ProductQualityReport = {
  version: number;
  brand: string;
  source: {
    platform: string;
    region: string;
    inputFile: string;
    collectedAt: string;
  };
  totals: {
    reviews: number;
    averageRating: number | null;
    fiveStarReviews: number;
    lowRatingReviews: number;
    verifiedPurchases: number;
    thaiReviews: number;
    issueReviews: number;
    humanReview: number;
  };
  products: ProductQualityProduct[];
  topics: ProductQualityTopic[];
  evidence: ProductQualityEvidence[];
  methodology: {
    sentiment: string;
    qualityTopics: string;
    limitations: string[];
  };
};

const qualityFiles: Record<string, string> = {
  "laglace-clean-social-report": "laglace-product-quality.json",
};

const qualityReviewFiles: Record<string, string> = {
  "laglace-clean-social-report": "laglace-product-reviews-normalized.json",
};

export function getProductQualityBySlug(slug: string): ProductQualityReport | null {
  const fileName = qualityFiles[slug];
  if (!fileName) return null;

  const filePath = path.join(process.cwd(), "data", "reports", fileName);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as ProductQualityReport;
}

export function getProductQualityReviewsBySlug(slug: string): ProductQualityReview[] {
  const fileName = qualityReviewFiles[slug];
  if (!fileName) return [];

  const filePath = path.join(process.cwd(), "work", "reviewed", fileName);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as ProductQualityReview[];
}
