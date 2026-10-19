import type { ProductQualityReport, ProductQualityReview } from "./productQuality";
import { getProductQualitySentiment } from "./productQualitySentiment";

// Below this many reviews a share is shown as a count, never as a percentage.
export const MIN_SAMPLE_FOR_PERCENT = 30;

export const QUALITY_TOPICS = [
  "สีและเฉดสี",
  "เนื้อสัมผัสและการเกลี่ย",
  "ติดทนและกันน้ำ",
  "ผลลัพธ์การใช้งาน",
  "การระคายเคืองและผิวแพ้ง่าย",
  "กลิ่น",
  "แพ็กเกจและการใช้งาน",
  "ราคาและความคุ้มค่า",
  "การจัดส่งและร้านค้า",
] as const;

export const EXPERIENCE_TYPES = ["ประสบการณ์ใช้สินค้า", "การจัดส่งและร้านค้า", "ข้อความสั้น/ข้อมูลไม่เพียงพอ"] as const;

export type Segment = {
  reviews: number;
  rated: number;
  ratingSum: number;
  positive: number;
  neutral: number;
  negative: number;
  topics: Record<string, number>;
  experience: Record<string, number>;
};

export type DashboardProduct = {
  id: string;
  /** Matches ProductQualityReview.productName, the value the quality explorer filters on. */
  key: string;
  name: string;
  label: string;
  category: string;
  segments: { all: Segment };
};

export type QualityDashboardData = {
  source: { platform: string; region: string; collectedAt: string | null };
  products: DashboardProduct[];
};

function emptySegment(): Segment {
  return {
    reviews: 0,
    rated: 0,
    ratingSum: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
    topics: Object.fromEntries(QUALITY_TOPICS.map((topic) => [topic, 0])),
    experience: Object.fromEntries(EXPERIENCE_TYPES.map((type) => [type, 0])),
  };
}

function addReview(segment: Segment, review: ProductQualityReview) {
  segment.reviews += 1;
  if (typeof review.rating === "number") {
    segment.rated += 1;
    segment.ratingSum += review.rating;
  }
  // Same rule as the quality page: 5 stars = positive, 3–4 = neutral, 1–2 = negative.
  segment[getProductQualitySentiment(review)] += 1;
  for (const topic of review.qualityTopics) {
    if (topic in segment.topics) segment.topics[topic] += 1;
  }
  if (review.experienceType in segment.experience) segment.experience[review.experienceType] += 1;
}

/** Aggregates reviews per product at build time so the dashboard ships kilobytes, not the 9 MB review list. */
export function buildQualityDashboard(quality: ProductQualityReport, reviews: ProductQualityReview[]): QualityDashboardData {
  const products = new Map<string, DashboardProduct>();

  for (const review of reviews) {
    let product = products.get(review.productId);
    if (!product) {
      const meta = quality.products.find((item) => item.id === review.productId);
      product = {
        id: review.productId,
        key: review.productName,
        name: meta?.sourceName || review.sourceName,
        label: meta?.label || review.productLabel,
        category: meta?.category || review.productCategory,
        segments: { all: emptySegment() },
      };
      products.set(review.productId, product);
    }
    addReview(product.segments.all, review);
  }

  return {
    source: {
      platform: quality.source.platform,
      region: quality.source.region,
      collectedAt: quality.source.collectedAt ?? null,
    },
    products: Array.from(products.values()),
  };
}

/** Returns null when the base is too small for a percentage to be honest. */
export function shareOf(count: number, base: number): number | null {
  if (base < MIN_SAMPLE_FOR_PERCENT) return null;
  return (count / base) * 100;
}

/** 95% margin of error, in percentage points, for a share measured on `base` reviews. */
export function marginOfError(sharePercent: number, base: number): number {
  const p = sharePercent / 100;
  return 196 * Math.sqrt((p * (1 - p)) / Math.max(base, 1));
}

/**
 * Average of per-product shares, each product counted once. Products were sampled at
 * 1,000 or 500 reviews, so pooling raw counts would let the larger samples dominate.
 */
export function equalWeightShare(segments: Segment[], pick: (segment: Segment) => number, base: (segment: Segment) => number): number | null {
  const shares = segments.map((segment) => shareOf(pick(segment), base(segment))).filter((share): share is number => share !== null);
  return shares.length ? shares.reduce((sum, share) => sum + share, 0) / shares.length : null;
}

export function averageRating(segment: Segment): number | null {
  return segment.rated ? segment.ratingSum / segment.rated : null;
}

export function equalWeightRating(segments: Segment[]): number | null {
  const ratings = segments.filter((segment) => segment.rated >= MIN_SAMPLE_FOR_PERCENT).map(averageRating).filter((value): value is number => value !== null);
  return ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : null;
}
