import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getReportBySlug, getReportSlugs } from "@/lib/reports";
import EvidenceExplorer from "@/components/report/EvidenceExplorer";
import ReportNavigation from "@/components/report/ReportNavigation";
import ReportActions from "@/components/report/ReportActions";

export function generateStaticParams() { return getReportSlugs().map(slug => ({ slug })); }
export function generateMetadata({ params }: { params: { slug: string } }) {
  if (!getReportSlugs().includes(params.slug)) return {};
  return { title: `หลักฐาน · ${getReportBySlug(params.slug).title} — PUBLIC / NOTE` };
}
export default function EvidencePage({ params }: { params: { slug: string } }) {
  if (!getReportSlugs().includes(params.slug)) notFound();
  const report = getReportBySlug(params.slug);
  return <><a className="skip" href="#main">ข้ามไปยังหลักฐาน</a><div className="shell"><ReportNavigation slug={report.slug} evidencePage /><main className="main" id="main">
    <div className="toolbar"><Link className="crumb" href={`/reports/${report.slug}`}>← กลับรายงาน {report.title}</Link><ReportActions report={report} /></div>
    <header className="evidence-header"><p className="eyebrow">THE EVIDENCE / TIKTOK</p><h1>เสียงตอบรับต่อ {report.title}</h1><p>ค้นหาและตรวจสอบข้อความที่ใช้ประกอบรายงาน</p>{report.status !== "published" && <span className="tag">{report.status === "demo" ? "ข้อมูลตัวอย่าง" : "ฉบับร่าง · อยู่ระหว่างตรวจทาน"}</span>}</header>
    <Suspense fallback={<div className="card empty">กำลังเตรียมตัวกรอง…</div>}><EvidenceExplorer evidence={report.evidence} timezone={report.period.timezone} /></Suspense>
  </main></div></>;
}
