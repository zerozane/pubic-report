import type { ReportSummary } from "@/lib/types";

export default function SummaryCards({ summary: s }: { summary: ReportSummary }) {
  const cards = [
    ["โพสต์ต้นทาง", s.postCount.toLocaleString("th-TH"), "โพสต์ TikTok ที่เลือกเพื่อดึงคอมเมนต์เชิงลึก"],
    ["ความคิดเห็น", s.commentCount.toLocaleString("th-TH"), "คอมเมนต์ทั้งหมดหลัง normalize และตัดซ้ำ"],
    ["เชิงลบ", s.negativeCount.toLocaleString("th-TH"), "เสียงราคาแพง เลี่ยงซื้อ หรือประชดเรื่องความคุ้มค่า"],
    ["เชิงบวก", s.positiveCount.toLocaleString("th-TH"), "ข้อความอยากได้หรือรอซื้อที่อ่านว่าเป็น intent จริง"],
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
