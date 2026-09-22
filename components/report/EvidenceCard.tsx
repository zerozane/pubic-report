import { ExternalLink } from "lucide-react";
import type { ReportEvidence } from "@/lib/types";
import { formatReportDate, getSentimentLabel } from "@/lib/format";

const hiddenTopics = new Set([
  "ความคิดเห็นไทย",
  "ความคิดเห็นหลายภาษา",
  "โพสต์ต้นทาง",
  "iPhone 18",
  "iPhone 18 ประเทศไทย",
]);

const topicLabels: Record<string, string> = {
  "ตั้งใจซื้อ/รออัปเกรด": "ความสนใจ/อยากได้",
  "นอกประเด็น/แก้ข้อมูล": "นอกประเด็น/แก้ข้อมูล",
  "ข้อความสั้น/อีโมจิ": "ข้อความสั้น/อีโมจิ",
  "ราคา/ความคุ้มค่า": "ราคา/ความคุ้มค่า",
  "มุก/ประชด": "มุก/ประชด",
  "เทียบรุ่นก่อน": "เทียบรุ่นก่อน",
  "ฟีเจอร์/สเปก": "ฟีเจอร์/สเปก",
  "ดีไซน์/สี": "ดีไซน์/สี",
  "วันเปิดตัว/เข้าไทย": "วันเปิดตัว/เข้าไทย",
  "โปร/ช่องทางซื้อ": "โปร/ช่องทางซื้อ",
  "รอ/เลี่ยงการซื้อ": "รอ/เลี่ยงซื้อ",
  "ทางเลือกอื่น": "ทางเลือกอื่น",
};

export default function EvidenceCard({
  item,
  timezone = "Asia/Bangkok",
}: {
  item: ReportEvidence;
  timezone?: string;
}) {
  const safeUrl = item.sourceUrl && /^https?:\/\//i.test(item.sourceUrl) ? item.sourceUrl : null;
  const visibleTopics = item.topics.filter((topic) => !hiddenTopics.has(topic));

  return (
    <article className="card quote" id={`evidence-${item.id}`}>
      <div className="quote-top">
        <strong className="card-title">
          {item.recordType === "comment" ? "ความคิดเห็น" : "โพสต์"} · {item.platform}
        </strong>
        <span className={`sentiment ${item.sentiment ?? "unclassified"}`}>{getSentimentLabel(item.sentiment)}</span>
      </div>

      <blockquote>{item.text}</blockquote>

      {visibleTopics.length > 0 ? (
        <div className="topic-tags">
          {visibleTopics.map((topic) => (
            <span className="tag" key={topic}>
              {topicLabels[topic] ?? topic}
            </span>
          ))}
        </div>
      ) : null}

      <div className="quote-bottom">
        <span>{formatReportDate(item.publishedAt, timezone)}</span>
        {safeUrl ? (
          <a href={safeUrl} target="_blank" rel="noopener noreferrer">
            ต้นทาง <ExternalLink size={12} aria-hidden="true" />
          </a>
        ) : (
          <span>ไม่มีลิงก์ต้นทาง</span>
        )}
      </div>

      {item.isDemo ? <small className="section-side">ข้อความสมมติสำหรับออกแบบ</small> : null}
    </article>
  );
}
