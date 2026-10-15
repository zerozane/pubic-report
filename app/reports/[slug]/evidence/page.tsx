import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getReportSlugs } from "@/lib/reports";

export function generateStaticParams() {
  return getReportSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  if (!getReportSlugs().includes(params.slug)) return {};
  return { title: "เสียงผู้บริโภค" };
}

export default function EvidencePage({ params, searchParams }: { params: { slug: string }; searchParams?: { ids?: string } }) {
  if (!getReportSlugs().includes(params.slug)) notFound();
  const query = searchParams?.ids ? `?ids=${encodeURIComponent(searchParams.ids)}` : "";
  redirect(`/reports/${params.slug}${query}#stream`);
}
