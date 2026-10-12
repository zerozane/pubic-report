import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import AutoPrint from "@/components/report/AutoPrint";
import PrintButton from "@/components/report/PrintButton";
import { getReportBySlug, getReportSlugs } from "@/lib/reports";
import type { Platform, Report } from "@/lib/types";

const copy = {
  reportLabel: "Social Listening Report",
  overview: "\u0e20\u0e32\u0e1e\u0e23\u0e27\u0e21",
  voices: "\u0e40\u0e2a\u0e35\u0e22\u0e07\u0e1c\u0e39\u0e49\u0e0a\u0e21",
  channels: "\u0e0a\u0e48\u0e2d\u0e07\u0e17\u0e32\u0e07",
  evidence: "\u0e2b\u0e25\u0e31\u0e01\u0e10\u0e32\u0e19",
  back: "\u0e01\u0e25\u0e31\u0e1a\u0e20\u0e32\u0e1e\u0e23\u0e27\u0e21",
  title: "\u0e23\u0e32\u0e22\u0e07\u0e32\u0e19\u0e2a\u0e23\u0e38\u0e1b\u0e40\u0e2a\u0e35\u0e22\u0e07\u0e1c\u0e39\u0e49\u0e0a\u0e21",
  subtitle: "\u0e2a\u0e23\u0e38\u0e1b\u0e2a\u0e33\u0e2b\u0e23\u0e31\u0e1a PDF Export \u0e42\u0e14\u0e22\u0e43\u0e0a\u0e49\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e17\u0e35\u0e48\u0e01\u0e27\u0e32\u0e14\u0e21\u0e32\u0e08\u0e23\u0e34\u0e07",
  sentimentTitle: "\u0e01\u0e32\u0e23\u0e15\u0e2d\u0e1a\u0e23\u0e31\u0e1a\u0e08\u0e32\u0e01\u0e1c\u0e39\u0e49\u0e0a\u0e21",
  evidenceTitle: "\u0e2b\u0e25\u0e31\u0e01\u0e10\u0e32\u0e19\u0e2a\u0e33\u0e04\u0e31\u0e0d\u0e17\u0e35\u0e48\u0e04\u0e27\u0e23\u0e2d\u0e48\u0e32\u0e19",
  channelTitle: "\u0e0a\u0e48\u0e2d\u0e07\u0e17\u0e32\u0e07\u0e17\u0e35\u0e48\u0e1e\u0e1a\u0e02\u0e49\u0e2d\u0e04\u0e27\u0e32\u0e21",
  insightTitle: "\u0e2a\u0e23\u0e38\u0e1b\u0e2a\u0e34\u0e48\u0e07\u0e17\u0e35\u0e48\u0e04\u0e27\u0e23\u0e17\u0e33\u0e15\u0e48\u0e2d",
  records: "\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23",
  positive: "\u0e40\u0e0a\u0e34\u0e07\u0e1a\u0e27\u0e01",
  neutral: "\u0e01\u0e25\u0e32\u0e07",
  negative: "\u0e40\u0e0a\u0e34\u0e07\u0e25\u0e1a",
  totalRecords: "\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14",
  classified: "\u0e08\u0e33\u0e41\u0e19\u0e01 sentiment \u0e44\u0e14\u0e49",
  source: "\u0e41\u0e2b\u0e25\u0e48\u0e07\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25",
  method: "\u0e21\u0e32\u0e15\u0e23\u0e10\u0e32\u0e19 sentiment"
};

export function generateStaticParams() {
  return getReportSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  if (!getReportSlugs().includes(params.slug)) return {};
  return { title: "Export Summary - " + getReportBySlug(params.slug).title };
}

export default function SummaryPage({ params, searchParams }: { params: { slug: string }; searchParams?: { print?: string } }) {
  if (!getReportSlugs().includes(params.slug)) notFound();
  const report = getReportBySlug(params.slug);
  const stats = buildSummaryStats(report);
  const platformRows = buildPlatformRows(report);
  const topEvidence = report.evidence.filter((item) => item.recordType === "comment" && item.text.trim()).sort((a, b) => (b.engagement || 0) - (a.engagement || 0)).slice(0, 8);
  return (
    <div className="lg-page lg-summary-page">
      <AutoPrint enabled={searchParams?.print === "1"} />
      <header className="lg-topbar lg-report-topbar lg-summary-screenbar">
        <div className="lg-container lg-topbar-inner">
          <Link className="lg-brand lg-report-brand" href={"/reports/" + report.slug}>
            <span>{report.dashboard?.brandMark || "LG"}</span>
            <div><strong>{report.dashboard?.brandName || "LA GLACE"}</strong><small>PDF-ready summary</small></div>
          </Link>
          <nav className="lg-report-tabs" aria-label="Report sections">
            <Link href={"/reports/" + report.slug}>{copy.overview}</Link>
            <Link href={"/reports/" + report.slug + "#product-quality"}>คุณภาพสินค้า</Link>
            <Link href={"/reports/" + report.slug + "#stream"}>{copy.voices}</Link>
            <Link href={"/reports/" + report.slug + "/evidence"}>{copy.evidence}</Link>
            <Link href={"/reports/" + report.slug + "/engagement"}>Engagement</Link>
          </nav>
          <div className="lg-top-actions lg-report-actions"><Link className="lg-back-link" href={"/reports/" + report.slug}><ArrowLeft size={16} />{copy.back}</Link><PrintButton /></div>
        </div>
      </header>
      <main className="lg-summary-sheet">
        <section className="lg-summary-hero">
          <div><p>{copy.reportLabel} ? {formatDateRange(report)}</p><h1>{copy.title}<br />{report.dashboard?.brandName || "LA GLACE"}</h1><span>{copy.subtitle}</span></div>
          <aside><small>{copy.sentimentTitle}</small><strong>{stats.positiveRate}%</strong><span>{copy.positive}</span></aside>
        </section>
        <section className="lg-summary-kpis">
          <Metric label={copy.totalRecords} value={formatNumber(stats.total)} caption={copy.records} />
          <Metric label={copy.classified} value={formatNumber(stats.classified)} caption={copy.positive + " " + formatNumber(stats.positive) + " ? " + copy.neutral + " " + formatNumber(stats.neutral) + " ? " + copy.negative + " " + formatNumber(stats.negative)} />
          <Metric label="Engagement" value={formatCompact(stats.engagement)} caption="likes, replies, shares, views" />
          <Metric label="Source links" value={stats.withSource + "/" + stats.total} caption="auditable records" />
        </section>
        <section className="lg-summary-section two-col">
          <article><p className="lg-summary-eyebrow">Sentiment</p><h2>{copy.sentimentTitle}</h2><div className="lg-summary-bars"><Bar label="Positive" value={stats.positive} total={Math.max(stats.classified, 1)} tone="pos" /><Bar label="Neutral" value={stats.neutral} total={Math.max(stats.classified, 1)} tone="neu" /><Bar label="Negative" value={stats.negative} total={Math.max(stats.classified, 1)} tone="neg" /></div></article>
          <article><p className="lg-summary-eyebrow">Platforms</p><h2>{copy.channelTitle}</h2><div className="lg-summary-platforms">{platformRows.map((row) => <div key={row.platform}><b>{row.platform}</b><span>{formatNumber(row.total)} {copy.records}</span><i style={{ width: row.percent + "%" }} /></div>)}</div></article>
        </section>
        <section className="lg-summary-section"><p className="lg-summary-eyebrow">Key Evidence</p><h2>{copy.evidenceTitle}</h2><div className="lg-summary-evidence-list">{topEvidence.map((item) => <article key={item.id}><div><b>{item.platform}</b><span>{formatShortDate(item.publishedAt)} ? {item.sentiment || "unclassified"}</span></div><p>{item.text}</p>{item.sourceUrl ? <a href={item.sourceUrl}>{copy.evidence} <ExternalLink size={12} /></a> : null}</article>)}</div></section>
        <section className="lg-summary-section"><p className="lg-summary-eyebrow">Method</p><h2>{copy.insightTitle}</h2><div className="lg-summary-method"><p><b>{copy.source}:</b> {report.methodology.source}</p><p><b>{copy.method}:</b> {report.methodology.sentimentMethod}</p>{report.methodology.limitations.slice(0, 3).map((item) => <p key={item}>{item}</p>)}</div></section>
      </main>
    </div>
  );
}

function Metric({ label, value, caption }: { label: string; value: string; caption: string }) {
  return <article><span>{label}</span><strong>{value}</strong><small>{caption}</small></article>;
}

function Bar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const percent = Math.round((value / total) * 100);
  return <div className={"lg-summary-bar " + tone}><span>{label}</span><strong>{formatNumber(value)}</strong><i><b style={{ width: percent + "%" }} /></i><em>{percent}%</em></div>;
}

function buildSummaryStats(report: Report) {
  const positive = report.evidence.filter((item) => item.sentiment === "positive").length;
  const neutral = report.evidence.filter((item) => item.sentiment === "neutral").length;
  const negative = report.evidence.filter((item) => item.sentiment === "negative").length;
  const classified = positive + neutral + negative;
  const engagement = report.evidence.reduce((sum, item) => sum + (item.engagement || 0) + (item.metrics.likes || 0) + (item.metrics.replies || 0) + (item.metrics.shares || 0) + (item.metrics.views || 0), 0);
  const withSource = report.evidence.filter((item) => item.sourceUrl).length;
  return { total: report.evidence.length, positive, neutral, negative, classified, engagement, withSource, positiveRate: classified ? Math.round((positive / classified) * 100) : 0 };
}

function buildPlatformRows(report: Report) {
  const total = Math.max(report.evidence.length, 1);
  const map = new Map<Platform, number>();
  for (const item of report.evidence) map.set(item.platform, (map.get(item.platform) || 0) + 1);
  return Array.from(map.entries()).map(([platform, count]) => ({ platform, total: count, percent: Math.round((count / total) * 100) }));
}

function formatDateRange(report: Report) {
  return formatShortDate(report.period.from) + " - " + formatShortDate(report.period.to);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" }).format(new Date(value));
}

function formatNumber(value: number) { return Math.round(value).toLocaleString("th-TH"); }
function formatCompact(value: number) { if (value >= 1000000) return (value / 1000000).toFixed(1) + "M"; if (value >= 1000) return (value / 1000).toFixed(1) + "K"; return formatNumber(value); }
