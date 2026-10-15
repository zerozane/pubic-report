import type { ReportSummary } from "@/lib/types";

export default function SummaryCards({ summary }: { summary: ReportSummary }) {
  const cards = [
    ["โพสต์ต้นทาง", summary.postCount.toLocaleString("th-TH"), "โพสต์ที่ใช้เป็นต้นทางของชุดข้อมูล"],
    ["ความคิดเห็น", summary.commentCount.toLocaleString("th-TH"), "ความคิดเห็นหลัง normalize และตัดข้อมูลซ้ำ"],
    ["เชิงลบ", summary.negativeCount.toLocaleString("th-TH"), "คำร้องเรียน การปฏิเสธสินค้า หรือปัญหาที่ระบุชัดเจน"],
    ["เชิงบวก", summary.positiveCount.toLocaleString("th-TH"), "คำชม ความสนใจซื้อ หรือประสบการณ์ที่ดี"],
  ];

  return (
    <section className="kpis section" aria-label="ตัวเลขสำคัญของรายงาน">
      {cards.map(([label, value, foot], index) => (
        <article className="card metric" key={label}>
          <div className="kpi-top">
            {label}
            <span className="metric-index">0{index + 1}</span>
          </div>
          <div className="number">{value}</div>
          <div className="kpi-foot">{foot}</div>
        </article>
      ))}
    </section>
  );
}
