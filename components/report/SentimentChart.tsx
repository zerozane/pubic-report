import type { ReportSummary } from "@/lib/types";

export default function SentimentChart({ summary: s }: { summary: ReportSummary }) {
  const positive = s.classifiedComments ? (s.positiveCount / s.classifiedComments) * 100 : 0;
  const neutral = s.classifiedComments ? (s.neutralCount / s.classifiedComments) * 100 : 0;
  const negative = s.classifiedComments ? (s.negativeCount / s.classifiedComments) * 100 : 0;
  const background = s.classifiedComments
    ? `conic-gradient(var(--mint) 0 ${positive}%, #a5b3c8 ${positive}% ${positive + neutral}%, var(--red) ${positive + neutral}% 100%)`
    : "#dce3eb";

  return (
    <article className="card sentiment-card">
      <h3 className="card-title">สัดส่วนท่าทีที่อ่านได้</h3>
      <div className="score-row">
        <div
          className="ring"
          style={{ background }}
          role="img"
          aria-label={
            s.classifiedComments
              ? `เชิงลบ ${Math.round(negative)}% จาก ${s.classifiedComments} ความคิดเห็นที่จัดประเภทแล้ว`
              : "ยังไม่มีความคิดเห็นที่จัดประเภท"
          }
        >
          <div className="ring-inner">
            <strong>{s.classifiedComments ? `${Math.round(negative)}%` : "—"}</strong>
            <small>{s.classifiedComments ? "เชิงลบ" : "รอข้อมูล"}</small>
          </div>
        </div>
        <div className="score-copy">
          <strong>{s.classifiedComments ? "แรงต้านไม่ได้เยอะที่สุด แต่ควรอ่านละเอียด" : "ยังไม่จัดประเภท"}</strong>
          <p>
            จัดประเภทแล้ว {s.classifiedComments.toLocaleString("th-TH")} จาก {s.commentCount.toLocaleString("th-TH")} คอมเมนต์
          </p>
        </div>
      </div>
      <div className="legend">
        {[
          ["var(--mint)", "บวก", s.positiveCount],
          ["#a5b3c8", "กลาง", s.neutralCount],
          ["var(--red)", "ลบ", s.negativeCount],
        ].map(([color, label, count]) => (
          <span key={label}>
            <i style={{ background: String(color) }} />
            {label} {Number(count).toLocaleString("th-TH")}
          </span>
        ))}
      </div>
    </article>
  );
}
