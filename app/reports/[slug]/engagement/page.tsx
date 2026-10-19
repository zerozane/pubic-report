import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import QualityDashboard from "@/components/report/QualityDashboard";
import PrintButton from "@/components/report/PrintButton";
import { getReportBySlug, getReportSlugs } from "@/lib/reports";
import { getProductQualityBySlug, getProductQualityReviewsBySlug } from "@/lib/productQuality";
import { buildQualityDashboard } from "@/lib/qualityDashboard";

export function generateStaticParams() {
  return getReportSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  if (!getReportSlugs().includes(params.slug)) return {};
  return { title: `${getReportBySlug(params.slug).title} - Dashboard` };
}

export default function DashboardPage({ params }: { params: { slug: string } }) {
  if (!getReportSlugs().includes(params.slug)) notFound();
  const report = getReportBySlug(params.slug);
  const quality = getProductQualityBySlug(params.slug);
  // Aggregated on the server so the client receives per-product totals instead of every review.
  const data = quality ? buildQualityDashboard(quality, getProductQualityReviewsBySlug(params.slug)) : null;

  return (
    <div className="lg-page lg-editorial-page lg-engagement-page">
      <header className="lg-topbar lg-report-topbar">
        <div className="lg-container lg-topbar-inner">
          <Link className="lg-brand lg-report-brand" href={`/reports/${report.slug}`}>
            <span>{report.dashboard?.brandMark || "LG"}</span>
            <div>
              <strong>{report.dashboard?.brandName || "LA GLACE"}</strong>
              <small>Quality Dashboard</small>
            </div>
          </Link>
          <nav className="lg-report-tabs" aria-label="Report sections">
            <Link href={`/reports/${report.slug}`}>ภาพรวม</Link>
            <Link href={`/reports/${report.slug}/quality`}>คุณภาพสินค้า</Link>
            <Link href={`/reports/${report.slug}/engagement`} className="active" aria-current="page">Dashboard</Link>
          </nav>
          <div className="lg-top-actions lg-report-actions">
            <Link className="lg-back-link" href={`/reports/${report.slug}`}><ArrowLeft size={16} />กลับภาพรวม</Link>
            <PrintButton href={`/reports/${report.slug}/summary?print=1`} />
          </div>
        </div>
      </header>

      {data ? (
        <QualityDashboard data={data} slug={report.slug} />
      ) : (
        <main className="lg-container lg-main lg-dash">
          <div className="lg-dash-empty">
            <strong>รายงานนี้ยังไม่มีข้อมูลคุณภาพสินค้า</strong>
            <p>Dashboard ใช้รีวิวสินค้าเป็นข้อมูลหลัก เมื่อเชื่อมไฟล์คุณภาพสินค้ากับรายงานนี้แล้ว หน้านี้จะแสดงผลอัตโนมัติ</p>
            <Link href={`/reports/${report.slug}`}>กลับไปหน้าภาพรวม</Link>
          </div>
        </main>
      )}
    </div>
  );
}
