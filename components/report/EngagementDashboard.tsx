"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { BarChart3, Eye, Heart, MessageCircle, MousePointer2, Share2 } from "lucide-react";
import type { Platform, Report, ReportEvidence, Sentiment } from "@/lib/types";

const platformColors: Record<string, string> = {
  TikTok: "#00c7df",
  Instagram: "#c13584",
  Facebook: "#3166b1",
  X: "#332d2a",
  YouTube: "#c84a42",
};

const typeColors = {
  shares: "#ff486f",
  comments: "#f5dfad",
  reactions: "#8a5286",
  views: "#29307a",
};

const sentimentColors = {
  positive: "#e8557a",
  neutral: "#b99aa8",
  negative: "#6f4e63",
  unclassified: "#d6c5ce",
};

const metricLabels = {
  all: "ทั้งหมด",
  shares: "Share",
  comments: "Comment",
  reactions: "Reaction",
  views: "Views",
};

type PlatformFilter = "all" | Platform;
type SentimentFilter = "all" | Sentiment | "unclassified";
type RecordFilter = "all" | "post" | "comment";
type MetricFilter = "all" | keyof typeof typeColors;
type Bucket = { total: number; shares: number; comments: number; reactions: number; views: number };
type Slice = { label: string; value: number; color: string };

type EngagementDashboardProps = {
  report: Report;
};

export default function EngagementDashboard({ report }: EngagementDashboardProps) {
  const platforms = useMemo(() => {
    const values = [
      ...report.evidence.map((item) => item.platform),
      ...(report.dashboard?.ingestion.connectedSources.map((source) => source.platform) || []),
    ];
    return Array.from(new Set(values)).filter((value) => value !== "YouTube");
  }, [report]);
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [sentiment, setSentiment] = useState<SentimentFilter>("all");
  const [recordType, setRecordType] = useState<RecordFilter>("all");
  const [metric, setMetric] = useState<MetricFilter>("all");

  const data = useMemo(
    () => buildData(report, { platform, sentiment, recordType, metric }),
    [report, platform, sentiment, recordType, metric]
  );

  const activeDescription = [
    platform === "all" ? "ทุกแพลตฟอร์ม" : platform,
    sentiment === "all" ? "ทุก sentiment" : sentiment === "unclassified" ? "ยังไม่จัด sentiment" : sentimentLabel(sentiment),
    recordType === "all" ? "โพสต์และคอมเมนต์" : recordType === "post" ? "เฉพาะโพสต์" : "เฉพาะคอมเมนต์",
    metric === "all" ? "ทุก metric" : metricLabels[metric],
  ].join(" · ");

  return (
    <main className="lg-container lg-main lg-engagement-main">
      <section className="lg-engagement-controls">
        <div>
          <h1>Engagement Dashboard</h1>
          <p>สรุปยอดปฏิสัมพันธ์จากข้อมูล La Glace ที่กวาดมาจริง แยกตามวัน แพลตฟอร์ม sentiment และประเภท engagement</p>
        </div>
        <div className="lg-control-grid">
          <Field label="Period of time" value="Report Date Range" />
          <Field label="Status" value="Active" />
          <Field label="Campaign Name" value={report.dashboard?.brandName || report.title} />
          <Field label="Platform" value={platform === "all" ? "ALL" : platform} />
          <Field label="Period Range" value={`${formatShortDate(report.period.from)} - ${formatShortDate(report.period.to)}`} />
          <Field label="Active Filter" value={activeDescription} />
        </div>
      </section>

      <section className="lg-engagement-filter lg-engagement-filter-simple" aria-label="Engagement filters">
        <div className="lg-filter-simple-head">
          <div>
            <h2>Filter</h2>
            <p>{formatNumber(data.filteredCount)} จาก {formatNumber(report.evidence.length)} รายการ</p>
          </div>
          <button type="button" onClick={() => { setPlatform("all"); setSentiment("all"); setRecordType("all"); setMetric("all"); }}>
            รีเซ็ต
          </button>
        </div>

        <div className="lg-filter-simple-body">
          <div className="lg-platform-strip" aria-label="Platform filter">
            <FilterChip active={platform === "all"} onClick={() => setPlatform("all")}>ALL</FilterChip>
            {platforms.map((value) => (
              <FilterChip
                key={value}
                active={platform === value}
                color={platformColors[value] || "#fb6f92"}
                onClick={() => setPlatform(value)}
              >
                {value}
              </FilterChip>
            ))}
          </div>

          <div className="lg-compact-filters">
            <CompactSelect label="Sentiment" value={sentiment} onChange={(value) => setSentiment(value as SentimentFilter)}>
              <option value="all">ทุก sentiment</option>
              <option value="positive">เชิงบวก</option>
              <option value="neutral">กลาง</option>
              <option value="negative">เชิงลบ</option>
              <option value="unclassified">ไม่จัดกลุ่ม</option>
            </CompactSelect>
            <CompactSelect label="ชนิดข้อมูล" value={recordType} onChange={(value) => setRecordType(value as RecordFilter)}>
              <option value="all">โพสต์ + คอมเมนต์</option>
              <option value="post">โพสต์</option>
              <option value="comment">คอมเมนต์</option>
            </CompactSelect>
            <CompactSelect label="Metric" value={metric} onChange={(value) => setMetric(value as MetricFilter)}>
              {(Object.keys(metricLabels) as MetricFilter[]).map((value) => <option key={value} value={value}>{metricLabels[value]}</option>)}
            </CompactSelect>
          </div>
        </div>
      </section>

      {data.filteredCount ? (
        <>
          <section className="lg-engagement-grid two-one">
            <ChartCard title="Daily Engagement by Date" subtitle="Platforms">
              <LineChart labels={data.days} series={data.platformSeries} />
            </ChartCard>
            <ChartCard title="Engagement Share" subtitle="Platform share">
              <DonutPair current={data.currentPlatformShare} previous={data.previousPlatformShare} totalCurrent={data.current.total} totalPrevious={data.previous.total} />
            </ChartCard>
          </section>

          <section className="lg-engagement-grid two-one">
            <ChartCard title="Daily Engagement Type by Date" subtitle={metric === "all" ? "Share, Comment, Reaction, Views" : metricLabels[metric]}>
              <LineChart labels={data.days} series={data.typeSeries} />
            </ChartCard>
            <ChartCard title="Engagement Type Share" subtitle="Current vs previous mix">
              <DonutPair current={typeSlices(data.current, metric)} previous={typeSlices(data.previous, metric)} totalCurrent={data.current.total} totalPrevious={data.previous.total} />
            </ChartCard>
          </section>

          <section className="lg-total-engagement">
            <Metric label="Total Engagement" value={formatCompact(data.current.total)} delta={pct(data.current.total, data.previous.total)} icon={<MousePointer2 size={18} />} active={metric === "all"} />
            <Metric label="Share" value={formatNumber(data.current.shares)} delta={pct(data.current.shares, data.previous.shares)} icon={<Share2 size={18} />} active={metric === "shares"} />
            <Metric label="Comment" value={formatNumber(data.current.comments)} delta={pct(data.current.comments, data.previous.comments)} icon={<MessageCircle size={18} />} active={metric === "comments"} />
            <Metric label="Reaction" value={formatNumber(data.current.reactions)} delta={pct(data.current.reactions, data.previous.reactions)} icon={<Heart size={18} />} active={metric === "reactions"} />
            <Metric label="Views" value={formatCompact(data.current.views)} delta={pct(data.current.views, data.previous.views)} icon={<Eye size={18} />} active={metric === "views"} />
          </section>

          <section className="lg-engagement-grid halves">
            <ChartCard title="Engagement by Sentiment" subtitle="Current vs previous period">
              <Bars labels={data.sentimentBars.map((x) => x.label)} previous={data.sentimentBars.map((x) => x.previous)} current={data.sentimentBars.map((x) => x.current)} color="#e8557a" soft="#ffb8c9" />
              <DeltaTable labels={data.sentimentBars.map((x) => x.label)} rows={data.sentimentRows} />
            </ChartCard>
            <ChartCard title="Engagement by Platform" subtitle="Current vs previous period">
              <Bars labels={data.platformBars.map((x) => x.label)} previous={data.platformBars.map((x) => x.previous)} current={data.platformBars.map((x) => x.current)} color="#c13584" soft="#f6a8c2" />
              <DeltaTable labels={data.platformBars.map((x) => x.label)} rows={data.platformRows} />
            </ChartCard>
          </section>
        </>
      ) : (
        <section className="lg-engagement-card lg-empty-engagement">
          <h2>ไม่มีข้อมูลในตัวกรองนี้</h2>
          <p>ลองเลือกแพลตฟอร์ม sentiment หรือประเภท record อื่นเพื่อดูกราฟจากข้อมูลที่กวาดมา</p>
        </section>
      )}
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="lg-field"><small>{label}</small><span>{value}</span></div>;
}

function CompactSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label className="lg-compact-select"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>;
}

function FilterChip({ active, color, onClick, children }: { active: boolean; color?: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={active ? "active" : ""}
      style={{ "--chip": color || "#fb6f92" } as CSSProperties}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <article className="lg-engagement-card"><div className="lg-card-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><BarChart3 size={18} /></div>{children}<small className="lg-chart-note">Calculated from scraped records in this report. Not official platform analytics.</small></article>;
}

function LineChart({ labels, series }: { labels: string[]; series: Array<{ name: string; color: string; values: number[] }> }) {
  const width = 900;
  const height = 330;
  const max = Math.max(...series.flatMap((s) => s.values), 1);
  const chartLeft = 64;
  const chartRight = width - 56;
  const chartTop = 34;
  const chartBottom = height - 54;
  const yTicks = [1, 0.75, 0.5, 0.25, 0];
  if (!series.length) return <div className="lg-chart-empty">ไม่มี series สำหรับเงื่อนไขนี้</div>;
  return (
    <div className="lg-line-panel">
      <div className="lg-chart-legend">{series.map((s) => <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>)}</div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Engagement line chart">
        {yTicks.map((tick) => {
          const y = chartTop + (1 - tick) * (chartBottom - chartTop);
          return <g key={tick}><line x1={chartLeft} x2={chartRight} y1={y} y2={y} /><text className="lg-axis-label" x="12" y={y + 4}>{formatCompact(max * tick)}</text></g>;
        })}
        {series.map((s) => {
          const pts = s.values.map((v, i) => ({ x: chartLeft + (i / Math.max(labels.length - 1, 1)) * (chartRight - chartLeft), y: chartBottom - (v / max) * (chartBottom - chartTop), value: v }));
          const d = pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
          const lastPoint = pts[pts.length - 1];
          return <g key={s.name}><path d={d} style={{ stroke: s.color }} />{pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" style={{ fill: s.color }} />)}{lastPoint ? <text className="lg-series-value" x={Math.min(lastPoint.x + 8, width - 48)} y={Math.max(lastPoint.y - 8, 18)} style={{ fill: s.color }}>{formatCompact(lastPoint.value)}</text> : null}</g>;
        })}
        {labels.map((label, i) => <text key={`${label}-${i}`} x={chartLeft + (i / Math.max(labels.length - 1, 1)) * (chartRight - chartLeft)} y={height - 16}>{label}</text>)}
      </svg>
    </div>
  );
}

function DonutPair({ current, previous, totalCurrent, totalPrevious }: { current: Slice[]; previous: Slice[]; totalCurrent: number; totalPrevious: number }) {
  return <div className="lg-donut-pair"><Donut slices={current} total={totalCurrent} label="Current Period" /><Donut slices={previous} total={totalPrevious} label="Previous Period" /></div>;
}

function Donut({ slices, total, label }: { slices: Slice[]; total: number; label: string }) {
  let cursor = 0;
  const visibleSlices = slices.filter((s) => s.value > 0);
  const stops = visibleSlices.map((s) => {
    const start = cursor;
    const end = cursor + (s.value / Math.max(total, 1)) * 100;
    cursor = end;
    return `${s.color} ${start}% ${end}%`;
  }).join(", ");
  return <div className="lg-donut-wrap"><div className="lg-engagement-donut" style={{ background: `conic-gradient(${stops || "#f4e7ef 0 100%"})` }}><strong>{formatCompact(total)}</strong></div><small>{label}</small><ul className="lg-donut-legend">{visibleSlices.map((s) => <li key={s.label}><i style={{ background: s.color }} /><span>{s.label}</span><b>{formatCompact(s.value)}</b><em>{formatPercent(s.value, total)}</em></li>)}</ul></div>;
}

function Bars({ labels, previous, current, color, soft }: { labels: string[]; previous: number[]; current: number[]; color: string; soft: string }) {
  const max = Math.max(...previous, ...current, 1);
  return <div><div className="lg-period-legend"><span><i style={{ background: color }} />Previous</span><span><i style={{ background: soft }} />Current</span></div><div className="lg-group-bars">{labels.map((label, i) => <div key={label}><span><i title={`Previous: ${formatCompact(previous[i])}`} style={{ height: `${(previous[i] / max) * 100}%`, background: color }} data-value={formatCompact(previous[i])} /><i title={`Current: ${formatCompact(current[i])}`} style={{ height: `${(current[i] / max) * 100}%`, background: soft }} data-value={formatCompact(current[i])} /></span><small>{label}</small></div>)}</div></div>;
}

function DeltaTable({ labels, rows }: { labels: string[]; rows: Array<{ label: string; values: number[] }> }) {
  return <div className="lg-delta-table"><div className="lg-delta-head"><b>Metric</b>{labels.map((label) => <span key={label}>{label}</span>)}</div>{rows.map((row) => <div key={row.label}><b>{row.label}</b>{labels.map((label, i) => <span key={label} className={row.values[i] >= 0 ? "up" : "down"}>{formatDelta(row.values[i])}</span>)}</div>)}</div>;
}

function Metric({ label, value, delta, icon, active }: { label: string; value: string; delta: number; icon: ReactNode; active: boolean }) {
  return <article className={active ? "active" : ""}><div>{icon}<span>{label}</span></div><strong>{value}</strong><em className={delta >= 0 ? "up" : "down"}>{delta >= 0 ? "^" : "v"} {Math.abs(delta).toFixed(2)}%</em></article>;
}

function buildData(report: Report, filters: { platform: PlatformFilter; sentiment: SentimentFilter; recordType: RecordFilter; metric: MetricFilter }) {
  const allRows = [...report.evidence].sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt));
  const dayKeys = Array.from(new Set(allRows.map((x) => x.publishedAt.slice(0, 10))));
  const filteredRows = allRows.filter((item) => {
    if (filters.platform !== "all" && item.platform !== filters.platform) return false;
    if (filters.recordType !== "all" && item.recordType !== filters.recordType) return false;
    if (filters.sentiment !== "all") {
      if (filters.sentiment === "unclassified" && item.sentiment !== null) return false;
      if (filters.sentiment !== "unclassified" && item.sentiment !== filters.sentiment) return false;
    }
    return true;
  });
  const mid = Math.max(Math.floor(dayKeys.length / 2), 1);
  const prevDays = new Set(dayKeys.slice(0, mid));
  const currDays = new Set(dayKeys.slice(mid).length ? dayKeys.slice(mid) : dayKeys.slice(0, mid));
  const previousRows = filteredRows.filter((x) => prevDays.has(x.publishedAt.slice(0, 10)));
  const currentRows = filteredRows.filter((x) => currDays.has(x.publishedAt.slice(0, 10)));
  const visiblePlatforms = filters.platform === "all" ? Array.from(new Set(filteredRows.map((x) => x.platform))) : [filters.platform];
  const sentiments: Sentiment[] = ["positive", "neutral", "negative"];
  const previous = focusBucket(sum(previousRows), filters.metric);
  const current = focusBucket(sum(currentRows), filters.metric);
  const platformSeries = visiblePlatforms.map((p) => ({
    name: p,
    color: platformColors[p] || "#fb6f92",
    values: dayKeys.map((d) => focusBucket(sum(filteredRows.filter((x) => x.platform === p && x.publishedAt.startsWith(d))), filters.metric).total),
  }));
  const typeKeys = (filters.metric === "all" ? ["shares", "comments", "reactions", "views"] : [filters.metric]) as Array<keyof typeof typeColors>;

  return {
    days: dayKeys.map(formatDay),
    filteredCount: filteredRows.length,
    previous,
    current,
    platformSeries,
    typeSeries: typeKeys.map((k) => ({ name: metricLabels[k], color: typeColors[k], values: dayKeys.map((d) => sum(filteredRows.filter((x) => x.publishedAt.startsWith(d)))[k]) })),
    currentPlatformShare: visiblePlatforms.map((p) => ({ label: p, value: focusBucket(sum(currentRows.filter((x) => x.platform === p)), filters.metric).total, color: platformColors[p] || "#fb6f92" })),
    previousPlatformShare: visiblePlatforms.map((p) => ({ label: p, value: focusBucket(sum(previousRows.filter((x) => x.platform === p)), filters.metric).total, color: platformColors[p] || "#fb6f92" })),
    sentimentBars: sentiments.map((s) => ({ label: sentimentLabel(s), previous: focusBucket(sum(previousRows.filter((x) => x.sentiment === s)), filters.metric).total, current: focusBucket(sum(currentRows.filter((x) => x.sentiment === s)), filters.metric).total })),
    platformBars: visiblePlatforms.map((p) => ({ label: p, previous: focusBucket(sum(previousRows.filter((x) => x.platform === p)), filters.metric).total, current: focusBucket(sum(currentRows.filter((x) => x.platform === p)), filters.metric).total })),
    sentimentRows: deltaRows(sentiments.map((s) => ({ previous: sum(previousRows.filter((x) => x.sentiment === s)), current: sum(currentRows.filter((x) => x.sentiment === s)) })), filters.metric),
    platformRows: deltaRows(visiblePlatforms.map((p) => ({ previous: sum(previousRows.filter((x) => x.platform === p)), current: sum(currentRows.filter((x) => x.platform === p)) })), filters.metric),
  };
}

function sum(records: ReportEvidence[]): Bucket {
  const b = records.reduce((acc, x) => {
    acc.shares += x.metrics.shares || 0;
    acc.comments += x.metrics.comments || x.metrics.replies || 0;
    acc.reactions += x.metrics.likes || x.engagement || 0;
    acc.views += x.metrics.views || 0;
    return acc;
  }, { shares: 0, comments: 0, reactions: 0, views: 0 });
  return { ...b, total: b.shares + b.comments + b.reactions + b.views };
}

function focusBucket(bucket: Bucket, metric: MetricFilter): Bucket {
  if (metric === "all") return bucket;
  return { shares: metric === "shares" ? bucket.shares : 0, comments: metric === "comments" ? bucket.comments : 0, reactions: metric === "reactions" ? bucket.reactions : 0, views: metric === "views" ? bucket.views : 0, total: bucket[metric] };
}

function typeSlices(bucket: Bucket, metric: MetricFilter): Slice[] {
  const keys = (metric === "all" ? ["shares", "comments", "reactions", "views"] : [metric]) as Array<keyof typeof typeColors>;
  return keys.map((key) => ({ label: metricLabels[key], value: bucket[key], color: typeColors[key] }));
}

function deltaRows(items: Array<{ previous: Bucket; current: Bucket }>, metric: MetricFilter) {
  const keys = (metric === "all" ? ["shares", "comments", "reactions", "views"] : [metric]) as Array<keyof typeof typeColors>;
  return keys.map((key) => ({ label: metricLabels[key].toUpperCase(), values: items.map((x) => pct(x.current[key], x.previous[key])) }));
}

function pct(current: number, previous: number) {
  if (!previous && current) return 100;
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

function sentimentLabel(value: Sentiment) {
  if (value === "positive") return "เชิงบวก";
  if (value === "negative") return "เชิงลบ";
  return "กลาง";
}

function formatDelta(v: number) { return `${v > 0 ? "+" : ""}${v.toFixed(2)}%`; }
function formatPercent(value: number, total: number) { return `${((value / Math.max(total, 1)) * 100).toFixed(1)}%`; }
function formatNumber(v: number) { return Math.round(v).toLocaleString("th-TH"); }
function formatCompact(v: number) { if (v >= 1000000) return `${(v / 1000000).toFixed(3)}M`; if (v >= 1000) return `${(v / 1000).toFixed(1)}K`; return formatNumber(v); }
function formatShortDate(v: string) { return new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Bangkok" }).format(new Date(v)); }
function formatDay(v: string) { return new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "2-digit", timeZone: "Asia/Bangkok" }).format(new Date(v)); }
