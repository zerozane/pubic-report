type ProductQualitySentimentInput = {
  rating: number | null;
  sentiment: "positive" | "neutral" | "negative";
};

export function getProductQualitySentiment(review: ProductQualitySentimentInput) {
  const rating = Number(review.rating);
  if (rating === 5) return "positive" as const;
  if (rating === 3 || rating === 4) return "neutral" as const;
  if (rating === 1 || rating === 2) return "negative" as const;
  return review.sentiment;
}
