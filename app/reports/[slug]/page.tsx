import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlatformSummary, getReportBySlug, getReportSlugs } from "@/lib/reports";
import ReportActions from "@/components/report/ReportActions";
import ReportNavigation from "@/components/report/ReportNavigation";
import ReportHeader from "@/components/report/ReportHeader";
import SummaryCards from "@/components/report/SummaryCards";
import KeyFindings from "@/components/report/KeyFindings";
import TimelineChart from "@/components/report/TimelineChart";
import SentimentChart from "@/components/report/SentimentChart";
import TopicBreakdown from "@/components/report/TopicBreakdown";
import EvidenceCard from "@/components/report/EvidenceCard";
import Methodology from "@/components/report/Methodology";

export function generateStaticParams() {
  return getReportSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  if (!getReportSlugs().includes(params.slug)) return {};
  return { title: `${getReportBySlug(params.slug).title} — PUBLIC / NOTE` };
}

export default function ReportPage({ params }: { params: { slug: string } }) {
  if (!getReportSlugs().includes(params.slug)) notFound();

  const report = getReportBySlug(params.slug);
  const summary = getPlatformSummary(report);
  const comments = report.evidence.filter((item) => item.recordType === "comment");

  return (
    <>
      <a className="skip" href="#main">ข้ามไปยังรายงาน</a>
      <div className="shell">
        <ReportNavigation slug={report.slug} />
        <main className="main" id="main">
          <div className="toolbar">
            <div className="crumb">
              <Link href="/">หน้าแรก</Link> / {report.title}
            </div>
            <ReportActions report={report} />
          </div>

          {report.status !== "published" ? (
            <div className="demo">
              <strong>{report.status === "demo" ? "ข้อมูลตัวอย่าง" : "รายงานฉบับร่าง"}</strong> ·
              อยู่ระหว่างตรวจทาน ยังไม่ใช่รายงานฉบับเผยแพร่
            </div>
          ) : null}

          <ReportHeader report={report} />
          <SummaryCards summary={summary} />
          <KeyFindings report={report} />

          <section className="section" id="trend">
            <div className="section-head">
              <div>
                <span className="section-num">02 / CONVERSATION MOVEMENT</span>
                <h2>กระแสพุ่งช่วงเปิดบทสนทนา แล้วค่อยๆ แผ่วลง</h2>
                <p>ดูว่าความคิดเห็นกระจุกตัววันไหน และวันพีกเกิดขึ้นจากโพสต์หรือคอมเมนต์</p>
              </div>
            </div>
            <div className="trend-grid">
              <TimelineChart summary={summary} timezone={report.period.timezone} />
              <SentimentChart summary={summary} />
            </div>
          </section>

          <TopicBreakdown report={report} />

          <section className="section" id="evidence">
            <div className="section-head">
              <div>
                <span className="section-num">04 / THE VOICES</span>
                <h2>ตัวอย่างเสียงที่ควรอ่านก่อนสรุป</h2>
                <p>คอมเมนต์จริงจากชุดข้อมูล พร้อมเส้นทางกลับไปยังต้นทาง</p>
              </div>
              <Link className="btn" href={`/reports/${report.slug}/evidence`}>
                ดูหลักฐานทั้งหมด ↗
              </Link>
            </div>
            <div className="evidence-grid">
              {comments.length ? (
                comments.slice(0, 6).map((item) => (
                  <EvidenceCard item={item} timezone={report.period.timezone} key={item.id} />
                ))
              ) : (
                <div className="card empty">
                  <strong>รอความคิดเห็นสำหรับหัวข้อนี้</strong>
                  <p>เมื่อมีข้อมูล คุณจะค้นหา กรองประเด็น และเปิดลิงก์ต้นทางได้</p>
                </div>
              )}
            </div>
          </section>

          <Methodology report={report} />

          <footer className="footer">
            <span>PUBLIC / NOTE · {report.title}</span>
            <span>จัดทำโดย {report.author}</span>
          </footer>
        </main>
      </div>
    </>
  );
}
