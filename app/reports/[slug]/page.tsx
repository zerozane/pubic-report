import { notFound } from "next/navigation";
import SocialDashboard from "@/components/report/SocialDashboard";
import { getReportBySlug, getReportSlugs } from "@/lib/reports";

export function generateStaticParams() {
  return getReportSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  if (!getReportSlugs().includes(params.slug)) return {};
  return { title: `${getReportBySlug(params.slug).title} - Social Listening Dashboard` };
}

export default function ReportPage({ params }: { params: { slug: string } }) {
  if (!getReportSlugs().includes(params.slug)) notFound();

  const report = getReportBySlug(params.slug);
  return <SocialDashboard report={report} />;
}
