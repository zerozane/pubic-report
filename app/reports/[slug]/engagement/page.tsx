import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import EngagementDashboard from "@/components/report/EngagementDashboard";
import PrintButton from "@/components/report/PrintButton";
import { getReportBySlug, getReportSlugs } from "@/lib/reports";

export function generateStaticParams() {
  return getReportSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  if (!getReportSlugs().includes(params.slug)) return {};
  return { title: `${getReportBySlug(params.slug).title} - Engagement Dashboard` };
}

export default function EngagementPage({ params }: { params: { slug: string } }) {
  if (!getReportSlugs().includes(params.slug)) notFound();
  const report = getReportBySlug(params.slug);

  return (
    <div className="lg-page lg-editorial-page lg-engagement-page">
      <header className="lg-topbar lg-report-topbar">
        <div className="lg-container lg-topbar-inner">
          <Link className="lg-brand lg-report-brand" href={`/reports/${report.slug}`}>
            <span>{report.dashboard?.brandMark || "LG"}</span>
            <div>
              <strong>{report.dashboard?.brandName || "LA GLACE"}</strong>
              <small>Engagement Dashboard</small>
            </div>
          </Link>
          <nav className="lg-report-tabs" aria-label="Report sections">
            <Link href={`/reports/${report.slug}`}>ภาพรวม</Link>
            <Link href={`/reports/${report.slug}#product-quality`}>คุณภาพสินค้า</Link>
            <Link href={`/reports/${report.slug}#stream`}>เสียงผู้ชม</Link>
            <Link href={`/reports/${report.slug}/evidence`}>หลักฐาน</Link>
            <Link href={`/reports/${report.slug}/engagement`} className="active">Engagement</Link>
          </nav>
          <div className="lg-top-actions lg-report-actions">
            <Link className="lg-back-link" href={`/reports/${report.slug}`}><ArrowLeft size={16} />กลับภาพรวม</Link>
            <PrintButton href={`/reports/${report.slug}/summary?print=1`} />
          </div>
        </div>
      </header>

      <EngagementDashboard report={report} />
    </div>
  );
}
