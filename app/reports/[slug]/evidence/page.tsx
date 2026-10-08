import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getReportBySlug, getReportSlugs } from "@/lib/reports";
import EvidenceExplorer from "@/components/report/EvidenceExplorer";
import PrintButton from "@/components/report/PrintButton";

export function generateStaticParams() {
  return getReportSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  if (!getReportSlugs().includes(params.slug)) return {};
  return { title: `หลักฐาน - ${getReportBySlug(params.slug).title}` };
}

export default function EvidencePage({ params }: { params: { slug: string } }) {
  if (!getReportSlugs().includes(params.slug)) notFound();
  const report = getReportBySlug(params.slug);

  return (
    <div className="lg-page lg-editorial-page lg-evidence-page">
      <a className="skip" href="#main">ข้ามไปยังหลักฐาน</a>
      <header className="lg-topbar lg-report-topbar">
        <div className="lg-container lg-topbar-inner">
          <Link className="lg-brand lg-report-brand" href={`/reports/${report.slug}`}>
            <span>{report.dashboard?.brandMark || "LG"}</span>
            <div>
              <strong>{report.dashboard?.brandName || "LA GLACE"}</strong>
              <small>Evidence Library</small>
            </div>
          </Link>
          <nav className="lg-report-tabs" aria-label="Report sections">
            <Link href={`/reports/${report.slug}`}>ภาพรวม</Link>
            <Link href={`/reports/${report.slug}#stream`}>เสียงผู้ชม</Link>
            <Link href={`/reports/${report.slug}#channels`}>ช่องทาง</Link>
            <Link href={`/reports/${report.slug}/engagement`}>Engagement</Link>
            <Link href={`/reports/${report.slug}/evidence`} className="active">หลักฐาน</Link>
          </nav>
          <div className="lg-top-actions lg-report-actions">
            <Link className="lg-back-link" href={`/reports/${report.slug}`}><ArrowLeft size={16} />กลับภาพรวม</Link>
            <PrintButton href={`/reports/${report.slug}/summary?print=1`} />
          </div>
        </div>
      </header>

      <main className="lg-container lg-main lg-evidence-main" id="main">
        <header className="lg-evidence-hero">
          <p className="lg-kicker">Evidence Library</p>
          <h1>หลักฐานและเสียงผู้ชมของ {report.dashboard?.brandName || report.title}</h1>
          <p>ค้นหา กรอง และตรวจสอบข้อความจริงที่ใช้ประกอบรายงาน โดยยังคงลิงก์และบริบทของข้อมูลต้นทางเท่าที่ dataset มีให้</p>
          {report.status !== "published" ? <span>{report.status === "demo" ? "ข้อมูลตัวอย่าง" : "ฉบับร่าง - อยู่ระหว่างตรวจทาน"}</span> : null}
        </header>

        <Suspense fallback={<div className="lg-evidence-loading">กำลังเตรียมตัวกรอง...</div>}>
          <EvidenceExplorer evidence={report.evidence} timezone={report.period.timezone} />
        </Suspense>
      </main>
    </div>
  );
}
