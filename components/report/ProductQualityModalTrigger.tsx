"use client";

export type ProductQualityModalFilter = "low" | "watch" | "human" | "verified" | "five-star" | "topic";

export type ProductQualityModalRequest = {
  title: string;
  filter: ProductQualityModalFilter;
  topicName?: string;
};

export default function ProductQualityModalTrigger({
  title,
  count,
  filter,
  topicName,
}: ProductQualityModalRequest & { count: number }) {
  function openModal() {
    window.dispatchEvent(new CustomEvent<ProductQualityModalRequest>("product-quality:open-reviews", {
      detail: { title, filter, topicName },
    }));
  }

  return (
    <button className="lg-quality-modal-trigger" type="button" onClick={openModal}>
      ดูทั้งหมด {count.toLocaleString("th-TH")} รายการ
    </button>
  );
}
