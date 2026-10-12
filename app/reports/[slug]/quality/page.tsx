import { notFound } from "next/navigation";
import ProductQualityTemplate from "@/components/report/ProductQualityTemplate";
import { getReportBySlug, getReportSlugs } from "@/lib/reports";

export function generateStaticParams() {
  return getReportSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  if (!getReportSlugs().includes(params.slug)) return {};
  return { title: `${getReportBySlug(params.slug).title} - Product Quality` };
}

export default function ProductQualityPage({ params }: { params: { slug: string } }) {
  if (!getReportSlugs().includes(params.slug)) notFound();
  return <ProductQualityTemplate report={getReportBySlug(params.slug)} />;
}