import Link from "next/link";
import type { Report } from "@/lib/types";

const hiddenTopics = new Set([
  "ความคิดเห็นไทย",
  "ความคิดเห็นหลายภาษา",
  "โพสต์ต้นทาง",
  "iPhone 18",
  "iPhone 18 ประเทศไทย",
]);

const topicLabels: Record<string, string> = {
  "ตั้งใจซื้อ/รออัปเกรด": "ความสนใจและความอยากได้",
  "นอกประเด็น/แก้ข้อมูล": "ข้อความนอกประเด็นหรือแก้ข้อมูล",
  "ข้อความสั้น/อีโมจิ": "ปฏิกิริยาสั้นและอีโมจิ",
  "ราคา/ความคุ้มค่า": "คำวิจารณ์เรื่องราคาและความคุ้มค่า",
  "มุก/ประชด": "มุกประชดและการแซว",
  "เทียบรุ่นก่อน": "การเทียบกับรุ่นก่อน",
  "ฟีเจอร์/สเปก": "ฟีเจอร์และสเปก",
  "ดีไซน์/สี": "ดีไซน์และสี",
  "วันเปิดตัว/เข้าไทย": "วันเปิดตัวและการเข้าไทย",
  "โปร/ช่องทางซื้อ": "โปรโมชันและช่องทางซื้อ",
  "รอ/เลี่ยงการซื้อ": "รอหรือเลี่ยงการซื้อ",
  "ทางเลือกอื่น": "ทางเลือกอื่นแทน iPhone 18",
};

export default function TopicBreakdown({ report }: { report: Report }) {
  const counts = new Map<string, number>();

  report.evidence
    .filter((item) => item.recordType === "comment")
    .forEach((item) => {
      new Set(item.topics)
        .forEach((topic) => {
          if (hiddenTopics.has(topic)) return;
          counts.set(topic, (counts.get(topic) ?? 0) + 1);
        });
    });

  const topics = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const max = topics[0]?.[1] || 1;

  return (
    <section className="section" id="topics">
      <div className="section-head">
        <div>
          <span className="section-num">03 / CONVERSATION TOPICS</span>
          <h2>บทสนทนาแบ่งออกเป็นประเด็นไหนบ้าง</h2>
          <p>ตัด metadata ภาษาออกแล้ว เหลือเฉพาะหัวข้อที่ช่วยอธิบายว่าคนกำลังพูดเรื่องอะไร</p>
        </div>
      </div>

      {topics.length ? (
        <div className="topic-list">
          {topics.map(([topic, count]) => (
            <Link
              className="card topic-row"
              href={`/reports/${report.slug}/evidence?${new URLSearchParams({ topic })}`}
              key={topic}
            >
              <strong>{topicLabels[topic] ?? topic}</strong>
              <div className="bar-track">
                <div style={{ width: `${(count / max) * 100}%` }} />
              </div>
              <span>{count.toLocaleString("th-TH")} ความคิดเห็น ↗</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card empty">
          <strong>ยังไม่มีประเด็นที่จัดประเภทแล้ว</strong>
          <p>หมวดจะปรากฏตามสิ่งที่พบในความคิดเห็นจริง</p>
        </div>
      )}
    </section>
  );
}
