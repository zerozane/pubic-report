import Link from "next/link";
import { ArrowDownRight } from "lucide-react";
import type { Report } from "@/lib/types";
import { formatReportDate } from "@/lib/format";
import { getPlatformSummary } from "@/lib/reports";

export default function ReportHeader({ report }: { report: Report }) {
  const summary = getPlatformSummary(report);
  const classified = Math.max(summary.classifiedComments, 1);
  const negativePercent = Math.round((summary.negativeCount / classified) * 100);
  const neutralPercent = Math.round((summary.neutralCount / classified) * 100);
  const positivePercent = Math.round((summary.positiveCount / classified) * 100);

  return (
    <section className="hero report-hero" id="overview" aria-labelledby="title">
      <div>
        <p className="eyebrow">
          รายงานเสียงตอบรับจาก TikTok · {formatReportDate(report.period.from)}–{formatReportDate(report.period.to)}
        </p>
        <h1 id="title">{report.title}</h1>
        <p className="hero-subtitle">iPhone 18 · Thailand TikTok Conversation</p>
        <p className="intro">{report.summary}</p>
        <div className="meta">
          <span className="tag">{summary.postCount.toLocaleString("th-TH")} โพสต์ต้นทาง</span>
          <span className="tag">{summary.commentCount.toLocaleString("th-TH")} คอมเมนต์</span>
          <span className="tag">AI/manual review {summary.classifiedComments.toLocaleString("th-TH")} รายการ</span>
        </div>
      </div>

      <div className="hero-note sentiment-hero-card">
        <span className="smallcap">ท่าทีที่อ่านได้</span>
        <p>
          <strong>{negativePercent}%</strong>
          <br />
          เชิงลบ / แรงต้าน
        </p>
        <div className="sentiment-stack" aria-label="สัดส่วนความรู้สึก">
          <span className="sentiment-positive" style={{ width: `${positivePercent}%` }} />
          <span className="sentiment-neutral" style={{ width: `${neutralPercent}%` }} />
          <span className="sentiment-negative" style={{ width: `${negativePercent}%` }} />
        </div>
        <div className="sentiment-mini">
          <span>บวก {summary.positiveCount.toLocaleString("th-TH")}</span>
          <span>กลาง {summary.neutralCount.toLocaleString("th-TH")}</span>
          <span>ลบ {summary.negativeCount.toLocaleString("th-TH")}</span>
        </div>
        <Link href={`/reports/${report.slug}/evidence?sentiment=negative`}>
          เปิดเสียงเชิงลบ <ArrowDownRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
