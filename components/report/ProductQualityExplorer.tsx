"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProductQualityReview } from "@/lib/productQuality";

type Signal = "all" | "positive" | "neutral" | "watch" | "human" | "negative";
type Sort = "recent" | "low" | "high";

export default function ProductQualityExplorer({ reviews }: { reviews: ProductQualityReview[] }) {
  const [search, setSearch] = useState("");
  const [product, setProduct] = useState("all");
  const [topic, setTopic] = useState("all");
  const [signal, setSignal] = useState<Signal>("all");
  const [rating, setRating] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("recent");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSignal = params.get("signal");
    const requestedRating = params.get("rating");
    const requestedTopic = params.get("topic");

    if (requestedSignal && ["all", "positive", "neutral", "watch", "human", "negative"].includes(requestedSignal)) {
      setSignal(requestedSignal as Signal);
    }
    if (requestedRating && ["all", "low", "5", "4", "3", "2", "1"].includes(requestedRating)) {
      setRating(requestedRating);
    }
    if (requestedTopic) setTopic(requestedTopic);
    if (params.get("verified") === "1") setVerifiedOnly(true);
  }, []);

  const products = useMemo(() => {
    const names = new Map(reviews.map((review) => [review.productName, review.sourceName]));
    return Array.from(names.entries()).sort((left, right) => left[1].localeCompare(right[1], "en"));
  }, [reviews]);
  const topics = useMemo(() => unique(reviews.flatMap((review) => review.qualityTopics)), [reviews]);

  const filteredReviews = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("th-TH");
    return reviews
      .filter((review) => {
        const searchable = [review.reviewText, review.productName, review.productLabel, review.sku, ...review.qualityTopics]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("th-TH");
        if (normalizedSearch && !searchable.includes(normalizedSearch)) return false;
        if (product !== "all" && review.productName !== product) return false;
        if (topic !== "all" && !review.qualityTopics.includes(topic)) return false;
        if (rating === "low" && (review.rating === null || review.rating > 2)) return false;
        if (rating !== "all" && rating !== "low" && review.rating !== Number(rating)) return false;
        if (verifiedOnly && !review.verifiedPurchase) return false;
        if (signal === "positive" && review.sentiment !== "positive") return false;
        if (signal === "neutral" && review.sentiment !== "neutral") return false;
        if (signal === "watch" && !review.isIssue) return false;
        if (signal === "human" && !review.needsHumanReview) return false;
        if (signal === "negative" && review.sentiment !== "negative") return false;
        return true;
      })
      .sort((left, right) => {
        if (sort === "low") return (left.rating ?? 0) - (right.rating ?? 0);
        if (sort === "high") return (right.rating ?? 0) - (left.rating ?? 0);
        return (right.reviewTime || "").localeCompare(left.reviewTime || "");
      });
  }, [reviews, search, product, topic, signal, rating, verifiedOnly, sort]);

  useEffect(() => setPage(1), [search, product, topic, signal, rating, verifiedOnly, sort]);

  const pageSize = 50;
  const pageCount = Math.max(1, Math.ceil(filteredReviews.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleReviews = filteredReviews.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstResult = filteredReviews.length ? (currentPage - 1) * pageSize + 1 : 0;
  const lastResult = Math.min(currentPage * pageSize, filteredReviews.length);

  return (
    <section id="quality-explorer" className="lg-quality-section lg-quality-explorer">
      <div className="lg-quality-explorer-header">
        <div>
          <SectionHeading
            eyebrow="06 / CONSUMER VOICE"
            title="เสียงผู้บริโภค"
            description="ค้นหาและตรวจสอบรีวิวจริง โดยดูสินค้า ประเด็นคุณภาพ คะแนน และหลักฐานจากผู้ซื้อในจุดเดียว"
          />
          <p className="lg-quality-explorer-count">
            Showing {firstResult}-{lastResult} of {filteredReviews.length.toLocaleString("th-TH")} reviews · จากทั้งหมด {reviews.length.toLocaleString("th-TH")} รายการ
          </p>
        </div>
      </div>

      <div className="lg-quality-explorer-filters" aria-label="ตัวกรองรีวิวสินค้า">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาข้อความ สินค้า SKU หรือ keyword..." aria-label="ค้นหารีวิว" />
        <select value={product} onChange={(event) => setProduct(event.target.value)} aria-label="กรองสินค้า">
          <option value="all">ทุกสินค้า</option>
          {products.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={topic} onChange={(event) => setTopic(event.target.value)} aria-label="กรองประเด็นคุณภาพ">
          <option value="all">ทุกประเด็นคุณภาพ</option>
          {topics.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={signal} onChange={(event) => setSignal(event.target.value as Signal)} aria-label="กรองสัญญาณ">
          <option value="all">ทุกสัญญาณ</option>
          <option value="positive">เชิงบวก (5 ดาว)</option>
          <option value="neutral">เป็นกลาง (3–4 ดาว)</option>
          <option value="watch">ข้อควรระวัง</option>
          <option value="human">ต้องตรวจเพิ่มเติม</option>
          <option value="negative">เชิงลบ (1–2 ดาว)</option>
        </select>
        <select value={rating} onChange={(event) => setRating(event.target.value)} aria-label="กรองคะแนน">
          <option value="all">ทุกคะแนน</option>
          <option value="low">1–2 ดาว</option>
          {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} ดาว</option>)}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} aria-label="เรียงลำดับรีวิว">
          <option value="recent">ล่าสุด</option>
          <option value="low">คะแนนต่ำสุด</option>
          <option value="high">คะแนนสูงสุด</option>
        </select>
        <label className="lg-quality-explorer-check"><input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} /> เฉพาะ Verified purchase</label>
      </div>

      <div className="lg-quality-explorer-results">
        {visibleReviews.length ? visibleReviews.map((review) => <ReviewRow key={review.id} review={review} />) : (
          <div className="lg-quality-empty"><strong>ไม่พบรีวิวตามตัวกรอง</strong><p>ลองเปลี่ยนคำค้นหาหรือเลือกตัวกรองอื่น</p></div>
        )}
      </div>

      <div className="lg-quality-pagination">
        <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1}>ก่อนหน้า</button>
        <span>หน้า {currentPage} / {pageCount}</span>
        <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage >= pageCount}>ถัดไป</button>
      </div>
    </section>
  );
}

function ReviewRow({ review }: { review: ProductQualityReview }) {
  const sentimentLabel = review.sentiment === "positive" ? "เชิงบวก" : review.sentiment === "neutral" ? "เป็นกลาง" : "เชิงลบ";
  return (
    <article className="lg-quality-review-row">
      <div className="lg-quality-review-top">
        <div className="lg-quality-review-product"><strong>{review.sourceName}</strong><span>{review.productLabel} · {review.productCategory}</span></div>
        <div className="lg-quality-review-rating" aria-label={`${review.rating ?? "ไม่ระบุ"} ดาว`}>{review.rating ? `${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}` : "ไม่ระบุคะแนน"}</div>
        <div className="lg-quality-review-signals">
          <span className={`lg-quality-signal ${review.sentiment}`}>{sentimentLabel}</span>
          {review.isIssue && <span className="lg-quality-signal watch">ข้อควรระวัง</span>}
          {review.needsHumanReview && <span className="lg-quality-signal human">ต้องตรวจเพิ่มเติม</span>}
        </div>
      </div>
      <p className="lg-quality-review-text">{review.reviewText || "(ไม่มีข้อความรีวิว)"}</p>
      <div className="lg-quality-review-tags">{review.qualityTopics.map((item) => <span className="lg-quality-review-tag" key={item}>{item}</span>)}</div>
      <div className="lg-quality-review-meta">
        <span>{review.sku ? `SKU: ${review.sku}` : "ไม่มี SKU"}</span>
        <span>{review.reviewCountry || "ไม่ระบุประเทศ"}</span>
        {review.verifiedPurchase && <span className="lg-quality-verified">Verified purchase</span>}
        {review.productUrl && <a className="lg-quality-source-link" href={review.productUrl} target="_blank" rel="noreferrer">เปิดสินค้า ↗</a>}
      </div>
    </article>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="lg-quality-heading"><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>;
}

function unique(values: string[]) { return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right, "th")); }
