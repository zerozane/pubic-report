import Link from "next/link";
import type { Report, InsightType } from "@/lib/types";

const typeLabels: Record<InsightType, string> = {
  strength: "สัญญาณบวก",
  concern: "ข้อกังวล",
  opportunity: "โอกาส",
};

export default function KeyFindings({ report }: { report: Report }) {
  return (
    <section className="section" id="findings">
      <div className="section-head">
        <div>
          <span className="section-num">01 / KEY FINDINGS</span>
          <h2>สิ่งที่บทสนทนากำลังบอกเรา</h2>
          <p>ข้อค้นพบเรียงจากหลักฐานจริง พร้อมลิงก์กลับไปอ่านคอมเมนต์ต้นทาง</p>
        </div>
      </div>

      {report.insights.length ? (
        <div className="topics">
          {report.insights.map((insight, index) => (
            <article className="card topic" key={insight.id}>
              <div className={`topic-label ${insight.type}`}>
                0{index + 1} / {typeLabels[insight.type]}
              </div>
              <h3>{insight.title}</h3>
              <p>{insight.description}</p>
              <div className="topic-footer">
                <b>นำไปใช้:</b> {insight.recommendation}
              </div>
              <Link
                className="text-link"
                href={`/reports/${report.slug}/evidence?${new URLSearchParams({ ids: insight.evidenceIds.join(","), type: "all" })}`}
              >
                ดูหลักฐาน {insight.evidenceIds.length} รายการ ↗
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="card findings-empty">
          <div className="waiting-icon" aria-hidden="true">↗</div>
          <div>
            <h3>ข้อค้นพบจะเริ่มจากเสียงตอบรับจริง</h3>
            <p>รอความคิดเห็นที่ผ่านการตรวจทาน ก่อนสรุปจุดแข็ง ข้อกังวล และโอกาส</p>
          </div>
          <span className="tag">รอการวิเคราะห์</span>
        </div>
      )}
    </section>
  );
}
