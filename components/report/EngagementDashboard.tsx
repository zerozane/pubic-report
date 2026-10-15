"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { BarChart3, Eye, Heart, MessageCircle, MousePointer2, Share2 } from "lucide-react";
import type { Platform, Report, ReportEvidence, Sentiment } from "@/lib/types";
import type { ProductQualityProduct, ProductQualityReport, ProductQualityReview } from "@/lib/productQuality";

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

const sentimentBarColors = [
  { previous: "#15803d", current: "#86efac" },
  { previous: "#d97706", current: "#fcd34d" },
  { previous: "#dc2626", current: "#fca5a5" },
];

const metricLabels = {
  all: "ทั้งหมด",
  shares: "Share",
  comments: "Replies",
  reactions: "Comment Likes",
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
  quality?: ProductQualityReport | null;
  qualityReviews?: ProductQualityReview[];
};

export default function EngagementDashboard({ report, quality, qualityReviews = [] }: EngagementDashboardProps) {
  const platforms = useMemo(() => {
    const from = Date.parse(report.period.from);
    const to = Date.parse(report.period.to);
    const values = report.evidence
      .filter((item) => {
        const publishedAt = Date.parse(item.publishedAt);
        return publishedAt >= from && publishedAt <= to;
      })
      .map((item) => item.platform);
    return Array.from(new Set(values));
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
      {false && <>
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
          <p>{formatNumber(data.filteredCount)} จาก {formatNumber(report.evidence.length)} รายการ · ใช้เฉพาะข้อมูลในช่วงรายงาน</p>
          </div>
          <button type="button" onClick={() => { setPlatform("all"); setSentiment("all"); setRecordType("all"); setMetric("all"); }}>
            รีเซ็ต
          </button>
        </div>

        <div className="lg-filter-simple-body">
          <div className="lg-filter-top-grid">
          <div className="lg-filter-row lg-filter-platform-row">
            <div className="lg-filter-row-label"><strong>ช่องทาง</strong><span>เลือกแพลตฟอร์ม</span></div>
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
          </div>

          <div className="lg-filter-control-summary">
            <div className="lg-filter-row-label"><strong>ตัวกรอง</strong><span>ปรับมุมมองข้อมูล</span></div>
          </div>
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

      {false && (data.filteredCount ? (
        <>
          <section className="lg-total-engagement">
            <Metric label="Total Interactions" value={formatCompact(data.current.total)} delta={pct(data.current.total, data.previous.total)} icon={<MousePointer2 size={18} />} active={metric === "all"} />
            <Metric label="Share" value={formatNumber(data.current.shares)} delta={pct(data.current.shares, data.previous.shares)} icon={<Share2 size={18} />} active={metric === "shares"} />
            <Metric label="Replies" value={formatNumber(data.current.comments)} delta={pct(data.current.comments, data.previous.comments)} icon={<MessageCircle size={18} />} active={metric === "comments"} />
            <Metric label="Comment Likes" value={formatNumber(data.current.reactions)} delta={pct(data.current.reactions, data.previous.reactions)} icon={<Heart size={18} />} active={metric === "reactions"} />
            <Metric label="Views" value={formatCompact(data.current.views)} delta={pct(data.current.views, data.previous.views)} icon={<Eye size={18} />} active={metric === "views"} />
          </section>

          <section className="lg-engagement-grid two-one">
            <ChartCard title="Daily Engagement Type by Date" subtitle={metric === "all" ? "Shares, Replies, Comment Likes, Views" : metricLabels[metric]}>
              <DailyBarChart labels={data.days} series={data.typeSeries} />
            </ChartCard>
            <ChartCard title="สัดส่วนกิจกรรมที่บันทึกได้" subtitle="รวม Views · Total interactions ไม่รวม Views">
              <DonutPair current={typeSlices(data.current, metric)} previous={typeSlices(data.previous, metric)} totalCurrent={sliceTotal(typeSlices(data.current, metric))} totalPrevious={sliceTotal(typeSlices(data.previous, metric))} />
            </ChartCard>
          </section>

          <section className="lg-engagement-grid sentiment-breakdown">
            <ChartCard title="Engagement by Sentiment" subtitle={`Interaction total by sentiment (ไม่รวม Views) · Current ${formatNumber(data.filteredCount)} รายการ vs Previous ${formatNumber(data.previousFilteredCount)} รายการ`}>
              <Bars labels={data.sentimentBars.map((x) => x.label)} previous={data.sentimentBars.map((x) => x.previous)} current={data.sentimentBars.map((x) => x.current)} colors={sentimentBarColors} />
            </ChartCard>
            <ChartCard title="Metric" subtitle="เปอร์เซ็นต์การเปลี่ยนแปลงเทียบช่วงก่อนหน้า">
              <DeltaTable labels={data.sentimentBars.map((x) => x.label)} rows={data.sentimentRows} colors={sentimentBarColors} />
            </ChartCard>
          </section>

        </>
      ) : (
        <section className="lg-engagement-card lg-empty-engagement">
          <h2>ไม่มีข้อมูลในตัวกรองนี้</h2>
          <p>ลองเลือกแพลตฟอร์ม sentiment หรือประเภท record อื่นเพื่อดูกราฟจากข้อมูลที่กวาดมา</p>
        </section>
      ))}
      </>}
      {quality ? <ProductQualityEngagement quality={quality} reviews={qualityReviews} /> : (
        <section className="lg-engagement-card lg-empty-engagement">
          <h2>ไม่พบชุดข้อมูลคุณภาพสินค้า</h2>
          <p>หน้านี้แสดงเฉพาะสรุปคุณภาพสินค้าจากรีวิวที่เชื่อมโยงกับรายงาน</p>
        </section>
      )}
    </main>
  );
}

function ProductQualityEngagement({ quality, reviews }: { quality: ProductQualityReport; reviews: ProductQualityReview[] }) {
  const products = [...quality.products].sort((a, b) => b.count - a.count || (b.averageRating || 0) - (a.averageRating || 0));
  const topics = quality.topics.slice(0, 6);
  const maxReviewCount = Math.max(...products.map((product) => product.count), 1);
  const maxTopicCount = Math.max(...topics.map((topic) => topic.count), 1);
  const sentimentMix = [
    { label: "เชิงลบ (1–2 ดาว)", value: products.reduce((sum, product) => sum + product.ratingDistribution.filter((item) => item.rating <= 2).reduce((ratingSum, item) => ratingSum + item.count, 0), 0), color: "#e8557a" },
    { label: "เป็นกลาง (3–4 ดาว)", value: products.reduce((sum, product) => sum + product.ratingDistribution.filter((item) => item.rating === 3 || item.rating === 4).reduce((ratingSum, item) => ratingSum + item.count, 0), 0), color: "#fbbf24" },
    { label: "เชิงบวก (5 ดาว)", value: products.reduce((sum, product) => sum + (product.ratingDistribution.find((item) => item.rating === 5)?.count || 0), 0), color: "#10b981" },
  ];

  return (
    <section className="lg-quality-engagement" aria-labelledby="quality-engagement-title">
      <div className="lg-quality-engagement-header">
        <div>
          <span className="lg-quality-engagement-eyebrow">PRODUCT QUALITY × ENGAGEMENT</span>
          <h2 id="quality-engagement-title">Engagement ที่สะท้อนคุณภาพสินค้า</h2>
          <p>อ่านว่าผู้บริโภคมีส่วนร่วมกับสินค้าแต่ละตัวมากแค่ไหน และเสียงที่เกิดขึ้นมีสัญญาณคุณภาพแบบใด</p>
        </div>
        <div className="lg-quality-engagement-source">
          <strong>{formatNumber(quality.totals.reviews)} รีวิว</strong>
          <span>จำนวนรีวิวในชุดวิเคราะห์นี้</span>
        </div>
      </div>

      <div className="lg-quality-engagement-kpis">
        <QualityEngagementMetric label="รีวิวทั้งหมด" value={formatNumber(quality.totals.reviews)} detail="เสียงจากผู้ซื้อ" />
        <QualityEngagementMetric label="คะแนนเฉลี่ย" value={`${quality.totals.averageRating ?? "—"} / 5`} detail="คุณภาพที่ผู้ซื้อให้คะแนน" tone="positive" />
        <QualityEngagementMetric label="รีวิว 5 ดาว" value={formatPercent(quality.totals.fiveStarReviews, quality.totals.reviews)} detail={`${formatNumber(quality.totals.fiveStarReviews)} รายการ`} tone="positive" />
        <QualityEngagementMetric label="รีวิว 1–2 ดาว" value={formatPercent(quality.totals.lowRatingReviews, quality.totals.reviews)} detail={`${formatNumber(quality.totals.lowRatingReviews)} รายการที่ควรตรวจ`} tone="warning" />
      </div>

      <div className="lg-quality-visual-grid">
        <ChartCard title="Quality & Sentiment รายสินค้า" subtitle="ดูชื่อสินค้า คะแนนดาว และความรู้สึกจากคะแนนดาวแยกกันชัดเจน">
          <ProductQualityChart products={products} reviews={reviews} />
        </ChartCard>
        <ChartCard title="Quality Mix" subtitle="สัดส่วน sentiment ตามเกณฑ์คะแนนดาว">
          <div className="lg-donut-pair">
            <Donut
              slices={sentimentMix}
              total={quality.totals.reviews}
              label="สัดส่วนความรู้สึก"
            />
            <Donut
              slices={[
                { label: "มีประเด็น", value: quality.totals.issueReviews, color: "#f59e0b" },
                { label: "ไม่มีประเด็น", value: Math.max(quality.totals.reviews - quality.totals.issueReviews, 0), color: "#10b981" },
              ]}
              total={quality.totals.reviews}
              label="หัวข้อจากข้อความรีวิว"
            />
          </div>
        </ChartCard>
      </div>

      {false && <div className="lg-quality-engagement-grid">
        <article className="lg-quality-engagement-card">
          <div className="lg-quality-engagement-card-heading">
            <div><h3>ปริมาณเสียงรีวิวแยกตามสินค้า</h3><p>ยิ่งแถบยาว ยิ่งมีรีวิวในชุดข้อมูลมาก</p></div>
            <BarChart3 size={18} />
          </div>
          <div className="lg-quality-product-bars">
            {products.map((product) => (
              <div className="lg-quality-product-bar" key={product.id}>
                <div className="lg-quality-product-bar-label"><strong title={product.sourceName}>{product.sourceName}</strong><span>{formatNumber(product.count)} รีวิว · {formatPercent(product.count, quality.totals.reviews)}</span></div>
                <div className="lg-quality-product-bar-track"><i style={{ width: `${(product.count / maxReviewCount) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <small className="lg-quality-engagement-note">หมายเหตุ: นี่คือจำนวนรีวิวที่เก็บได้ ไม่ใช่ยอดขาย ยอดเข้าถึง หรือความนิยมทั้งหมดของสินค้า</small>
        </article>

        <article className="lg-quality-engagement-card">
          <div className="lg-quality-engagement-card-heading">
            <div><h3>สัญญาณคุณภาพต่อสินค้า</h3><p>คะแนนสูงและรีวิวลบน้อย สื่อถึงประสบการณ์ที่ดีกว่า</p></div>
            <span className="lg-quality-mini-legend"><i className="rating" />คะแนนเฉลี่ย</span>
          </div>
          <div className="lg-quality-signal-bars">
            {products.map((product) => <QualitySignalBar key={product.id} product={product} />)}
          </div>
          <small className="lg-quality-engagement-note">แถบสีชมพูคือคะแนนเฉลี่ยจาก 5 คะแนน ตัวเลขด้านขวาคือสัดส่วนรีวิว 1–2 ดาว</small>
        </article>
      </div>}

      <article className="lg-quality-engagement-card lg-quality-topic-engagement">
        <div className="lg-quality-engagement-card-heading">
          <div><h3>หัวข้อคุณภาพที่มีการพูดถึงมากที่สุด</h3><p>ใช้ดูว่าผู้บริโภคกำลังพูดถึงประเด็นใด และประเด็นไหนมีสัญญาณลบปะปน</p></div>
          <span className="lg-quality-mini-legend"><i className="topic" />จำนวนรีวิวที่พบหัวข้อ</span>
        </div>
        <div className="lg-quality-topic-bars">
          {topics.map((topic) => (
            <div className="lg-quality-topic-bar" key={topic.name}>
              <div className="lg-quality-topic-bar-label"><strong>{topic.name}</strong><span>{formatNumber(topic.count)} รีวิว · {formatPercent(topic.count, quality.totals.reviews)} ของรีวิว · ลบ {formatPercent(topic.negative, topic.count)}</span></div>
              <div className="lg-quality-topic-bar-track"><i style={{ width: `${(topic.count / maxTopicCount) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function QualitySignalBar({ product }: { product: ProductQualityProduct }) {
  const ratingPercent = ((product.averageRating || 0) / 5) * 100;
  return (
    <div className="lg-quality-signal-bar">
      <div className="lg-quality-signal-bar-label"><strong title={product.sourceName}>{product.sourceName}</strong><span>{product.averageRating ?? "—"} / 5</span></div>
      <div className="lg-quality-signal-bar-track"><i style={{ width: `${ratingPercent}%` }} /></div>
      <div className="lg-quality-signal-bar-meta"><span>5 ดาว {product.fiveStarPercent}%</span><b>1–2 ดาว {product.lowRatingPercent}%</b></div>
    </div>
  );
}

function ProductQualityChart({ products, reviews }: { products: ProductQualityProduct[]; reviews: ProductQualityReview[] }) {
  const sentimentByProduct = new Map<string, { positive: number; neutral: number; negative: number }>();
  reviews.forEach((review) => {
    const current = sentimentByProduct.get(review.productId) || { positive: 0, neutral: 0, negative: 0 };
    current[review.sentiment] += 1;
    sentimentByProduct.set(review.productId, current);
  });

  return (
    <div className="lg-product-quality-chart" role="img" aria-label="กราฟคุณภาพและ sentiment แยกตามสินค้า">
      <div className="lg-product-quality-legend"><span><i className="positive" />เชิงบวก</span><span><i className="neutral" />เป็นกลาง</span><span><i className="negative" />เชิงลบ</span></div>
      {products.map((product) => {
        const sentiment = sentimentByProduct.get(product.id) || { positive: 0, neutral: 0, negative: 0 };
        const total = Math.max(sentiment.positive + sentiment.neutral + sentiment.negative, product.count, 1);
        return (
          <div className="lg-product-quality-row" key={product.id}>
            <div className="lg-product-quality-row-head">
              <strong title={product.sourceName}>{product.sourceName}</strong>
              <span className="lg-product-quality-rating">★ {product.averageRating ?? "—"} / 5</span>
            </div>
            <div className="lg-product-quality-track">
              <i className="positive" style={{ width: `${(sentiment.positive / total) * 100}%` }} title={`เชิงบวก ${formatPercent(sentiment.positive, total)}`} />
              <i className="neutral" style={{ width: `${(sentiment.neutral / total) * 100}%` }} title={`เป็นกลาง ${formatPercent(sentiment.neutral, total)}`} />
              <i className="negative" style={{ width: `${(sentiment.negative / total) * 100}%` }} title={`เชิงลบ ${formatPercent(sentiment.negative, total)}`} />
            </div>
            <div className="lg-product-quality-row-meta"><span>เชิงบวก {formatPercent(sentiment.positive, total)}</span><span>เป็นกลาง {formatPercent(sentiment.neutral, total)}</span><b>เชิงลบ {formatPercent(sentiment.negative, total)}</b></div>
          </div>
        );
      })}
      <small className="lg-quality-engagement-note">แต่ละแถวคือ 1 สินค้า แถบสีคือสัดส่วน sentiment จากรีวิวของสินค้านั้น และคะแนนดาวคือค่าเฉลี่ยของสินค้า</small>
    </div>
  );
}

function QualityEngagementMetric({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail: string; tone?: "neutral" | "positive" | "warning" }) {
  return <article className={`lg-quality-engagement-metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
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
  return <article className="lg-engagement-card"><div className="lg-card-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><BarChart3 size={18} /></div>{children}<small className="lg-chart-note">Calculated from scraped records. Comment Likes = likes on scraped comments; Replies = replies to those comments. Views and shares use provider-reported fields.</small></article>;
}

function DailyBarChart({ labels, series }: { labels: string[]; series: Array<{ name: string; color: string; values: number[] }> }) {
  const width = 900;
  const height = 330;
  const chartLeft = 64;
  const chartRight = width - 30;
  const chartTop = 34;
  const chartBottom = height - 54;
  const totals = labels.map((_, index) => series.reduce((total, item) => total + (item.values[index] || 0), 0));
  const max = Math.max(...totals, 1);
  const slot = (chartRight - chartLeft) / Math.max(labels.length, 1);
  const barWidth = Math.max(4, Math.min(22, slot * 0.62));
  const labelStep = Math.max(1, Math.ceil(labels.length / 7));
  const yTicks = [1, 0.75, 0.5, 0.25, 0];
  if (!series.length) return <div className="lg-chart-empty">ไม่มีแพลตฟอร์มสำหรับเงื่อนไขนี้</div>;
  return <div className="lg-daily-bar-panel"><div className="lg-chart-legend">{series.map((item) => <span key={item.name}><i style={{ background: item.color }} />{item.name}</span>)}</div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Daily engagement bar chart">{yTicks.map((tick) => { const y = chartTop + (1 - tick) * (chartBottom - chartTop); return <g key={tick}><line x1={chartLeft} x2={chartRight} y1={y} y2={y} /><text className="lg-axis-label" x="12" y={y + 4}>{formatCompact(max * tick)}</text></g>; })}{labels.map((label, index) => { let cursor = chartBottom; const x = chartLeft + index * slot + (slot - barWidth) / 2; return <g key={`${label}-${index}`}>{series.map((item) => { const value = item.values[index] || 0; const barHeight = (value / max) * (chartBottom - chartTop); cursor -= barHeight; return value > 0 ? <rect key={item.name} x={x} y={cursor} width={barWidth} height={Math.max(barHeight, 1)} rx="3" style={{ fill: item.color }}><title>{`${label} · ${item.name} · ${formatCompact(value)}`}</title></rect> : null; })}{(index === 0 || index === labels.length - 1 || index % labelStep === 0) ? <text className="lg-daily-date" x={x + barWidth / 2} y={height - 16}>{label}</text> : null}</g>; })}</svg></div>;
}

function DonutPair({ current, previous, totalCurrent, totalPrevious }: { current: Slice[]; previous: Slice[]; totalCurrent: number; totalPrevious: number }) {
  return <div className="lg-donut-pair"><Donut slices={current} total={totalCurrent} label="Current Period" /><Donut slices={previous} total={totalPrevious} label="Previous Period" /></div>;
}

function Donut({ slices, total, label }: { slices: Slice[]; total: number; label: string }) {
  const displaySlices = slices.map((slice) => ({ ...slice, label: normalizeQualitySignalLabel(slice.label) }));
  let cursor = 0;
  const visibleSlices = displaySlices.filter((s) => s.value > 0);
  const leadingSlice = [...visibleSlices].sort((a, b) => b.value - a.value)[0];
  const stops = visibleSlices.map((s) => {
    const start = cursor;
    const end = cursor + (s.value / Math.max(total, 1)) * 100;
    cursor = end;
    return `${s.color} ${start}% ${end}%`;
  }).join(", ");
  return <div className="lg-donut-wrap"><div className="lg-engagement-donut" style={{ background: `conic-gradient(${stops || "#f4e7ef 0 100%"})` }} aria-label={`${label}: ${formatCompact(total)}`}><strong>{formatCompact(total)}</strong></div><div className="lg-donut-caption"><small>{label}</small>{leadingSlice ? <span>สูงสุด: {leadingSlice.label} · {formatPercent(leadingSlice.value, total)}</span> : null}</div><ul className="lg-donut-legend">{visibleSlices.map((s) => <li key={s.label}><i style={{ background: s.color }} /><span>{s.label}</span><b>{formatCompact(s.value)}</b><em>{formatPercent(s.value, total)}</em></li>)}</ul></div>;
}

function normalizeQualitySignalLabel(label: string) {
  if (label.includes("ประเด็น")) return label.includes("ไม่มี") ? "ไม่พบหัวข้อเพิ่มเติม (จากข้อความรีวิว)" : "พบหัวข้อให้ดูต่อ (จากข้อความรีวิว)";
  return label;
}

function Bars({ labels, previous, current, colors }: { labels: string[]; previous: number[]; current: number[]; colors: Array<{ previous: string; current: string }> }) {
  const max = Math.max(...previous, ...current, 1);
  return <div><div className="lg-period-legend"><span><i style={{ background: "#6b7280" }} />Previous</span><span><i style={{ background: "#d1d5db" }} />Current</span></div><div className="lg-group-bars">{labels.map((label, i) => <div key={label}><span><i title={`Previous: ${formatCompact(previous[i])}`} style={{ height: `${(previous[i] / max) * 100}%`, background: colors[i]?.previous || "#6b7280" }} data-value={formatCompact(previous[i])} /><i title={`Current: ${formatCompact(current[i])}`} style={{ height: `${(current[i] / max) * 100}%`, background: colors[i]?.current || "#d1d5db" }} data-value={formatCompact(current[i])} /></span><small style={{ color: colors[i]?.previous }}>{label}</small></div>)}</div></div>;
}

function DeltaTable({ labels, rows, colors }: { labels: string[]; rows: Array<{ label: string; values: Array<number | null> }>; colors: Array<{ previous: string; current: string }> }) {
  return <div className="lg-delta-table"><div className="lg-delta-head"><b>Metric</b>{labels.map((label, i) => <span key={label} style={{ color: colors[i]?.previous }}>{label}</span>)}</div>{rows.map((row) => <div key={row.label}><b>{row.label}</b>{labels.map((label, i) => <span key={label} className={row.values[i] === null ? "no-base" : row.values[i] >= 0 ? "up" : "down"} style={{ color: row.values[i] === null ? undefined : colors[i]?.previous }}>{formatDelta(row.values[i])}</span>)}</div>)}</div>;
}

function Metric({ label, value, delta, icon, active }: { label: string; value: string; delta: number | null; icon: ReactNode; active: boolean }) {
  return <article className={active ? "active" : ""}><div>{icon}<span>{label}</span></div><strong>{value}</strong><em className={delta === null || delta >= 0 ? "up" : "down"}>{delta === null ? "ไม่มีฐานเดิม" : `${delta >= 0 ? "^" : "v"} ${Math.abs(delta).toFixed(2)}%`}</em></article>;
}

function buildData(report: Report, filters: { platform: PlatformFilter; sentiment: SentimentFilter; recordType: RecordFilter; metric: MetricFilter }) {
  const periodFrom = Date.parse(report.period.from);
  const periodTo = Date.parse(report.period.to);
  const allRows = report.evidence.slice().sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt));
  const matchesFilters = (item: ReportEvidence) => {
    if (filters.platform !== "all" && item.platform !== filters.platform) return false;
    if (filters.recordType !== "all" && item.recordType !== filters.recordType) return false;
    if (filters.sentiment !== "all") {
      if (filters.sentiment === "unclassified" && item.sentiment !== null) return false;
      if (filters.sentiment !== "unclassified" && item.sentiment !== filters.sentiment) return false;
    }
    return true;
  };
  const currentRows = allRows.filter((item) => {
    const publishedAt = Date.parse(item.publishedAt);
    return publishedAt >= periodFrom && publishedAt <= periodTo && matchesFilters(item);
  });
  const previousTo = periodFrom - 1;
  const previousFrom = previousTo - (periodTo - periodFrom);
  const previousRows = allRows.filter((item) => {
    const publishedAt = Date.parse(item.publishedAt);
    return publishedAt >= previousFrom && publishedAt <= previousTo && matchesFilters(item);
  });
  const filteredRows = currentRows;
  const dayKeys = Array.from(new Set(currentRows.map((x) => reportDateKey(x.publishedAt, report.period.timezone))));
  const visiblePlatforms = filters.platform === "all" ? Array.from(new Set(filteredRows.map((x) => x.platform))) : [filters.platform];
  const sentiments: Sentiment[] = ["positive", "neutral", "negative"];
  const previous = focusBucket(sum(previousRows), filters.metric);
  const current = focusBucket(sum(currentRows), filters.metric);
  const platformSeries = visiblePlatforms.map((p) => ({
    name: p,
    color: platformColors[p] || "#fb6f92",
    values: dayKeys.map((d) => focusBucket(sum(filteredRows.filter((x) => x.platform === p && reportDateKey(x.publishedAt, report.period.timezone) === d)), filters.metric).total),
  }));
  const typeKeys = (filters.metric === "all" ? ["shares", "comments", "reactions", "views"] : [filters.metric]) as Array<keyof typeof typeColors>;
  return {
    days: dayKeys.map((day) => formatDay(day, new Set(dayKeys.map((value) => value.slice(0, 4))).size > 1)),
    filteredCount: filteredRows.length,
    previousFilteredCount: previousRows.length,
    previous,
    current,
    platformSeries,
    typeSeries: typeKeys.map((k) => ({ name: metricLabels[k], color: typeColors[k], values: dayKeys.map((d) => sum(filteredRows.filter((x) => reportDateKey(x.publishedAt, report.period.timezone) === d))[k]) })),
    currentPlatformShare: visiblePlatforms.map((p) => ({ label: p, value: focusBucket(sum(currentRows.filter((x) => x.platform === p)), filters.metric).total, color: platformColors[p] || "#fb6f92" })),
    previousPlatformShare: visiblePlatforms.map((p) => ({ label: p, value: focusBucket(sum(previousRows.filter((x) => x.platform === p)), filters.metric).total, color: platformColors[p] || "#fb6f92" })),
    sentimentBars: sentiments.map((s) => ({ label: sentimentLabel(s), previous: focusBucket(sum(previousRows.filter((x) => x.sentiment === s)), filters.metric).total, current: focusBucket(sum(currentRows.filter((x) => x.sentiment === s)), filters.metric).total })),
    sentimentRows: deltaRows(sentiments.map((s) => ({ previous: sum(previousRows.filter((x) => x.sentiment === s)), current: sum(currentRows.filter((x) => x.sentiment === s)) })), filters.metric),
  };
}

function sum(records: ReportEvidence[]): Bucket {
  const b = records.reduce((acc, x) => {
    acc.shares += x.metrics.shares || 0;
    acc.comments += x.metrics.comments || x.metrics.replies || 0;
    acc.reactions += x.metrics.likes || 0;
    acc.views += x.metrics.views || 0;
    return acc;
  }, { shares: 0, comments: 0, reactions: 0, views: 0 });
  return { ...b, total: b.shares + b.comments + b.reactions };
}

function focusBucket(bucket: Bucket, metric: MetricFilter): Bucket {
  if (metric === "all") return bucket;
  return { shares: metric === "shares" ? bucket.shares : 0, comments: metric === "comments" ? bucket.comments : 0, reactions: metric === "reactions" ? bucket.reactions : 0, views: metric === "views" ? bucket.views : 0, total: bucket[metric] };
}

function typeSlices(bucket: Bucket, metric: MetricFilter): Slice[] {
  const keys = (metric === "all" ? ["shares", "comments", "reactions", "views"] : [metric]) as Array<keyof typeof typeColors>;
  return keys.map((key) => ({ label: metricLabels[key], value: bucket[key], color: typeColors[key] }));
}

function sliceTotal(slices: Slice[]) {
  return slices.reduce((total, slice) => total + slice.value, 0);
}

function deltaRows(items: Array<{ previous: Bucket; current: Bucket }>, metric: MetricFilter) {
  const keys = (metric === "all" ? ["shares", "comments", "reactions", "views"] : [metric]) as Array<keyof typeof typeColors>;
  return keys.map((key) => ({ label: metricLabels[key].toUpperCase(), values: items.map((x) => pct(x.current[key], x.previous[key])) }));
}

function pct(current: number, previous: number): number | null {
  if (!previous && current) return null;
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

function sentimentLabel(value: Sentiment) {
  if (value === "positive") return "เชิงบวก";
  if (value === "negative") return "เชิงลบ";
  return "กลาง";
}

function formatDelta(v: number | null) { return v === null ? "ไม่มีฐานเดิม" : `${v > 0 ? "+" : ""}${v.toFixed(2)}%`; }
function formatPercent(value: number, total: number) { return `${((value / Math.max(total, 1)) * 100).toFixed(1)}%`; }
function formatNumber(v: number) { return Math.round(v).toLocaleString("th-TH"); }
function formatCompact(v: number) { if (v >= 1000000) return `${(v / 1000000).toFixed(3)}M`; if (v >= 1000) return `${(v / 1000).toFixed(1)}K`; return formatNumber(v); }
function formatShortDate(v: string) { return new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Bangkok" }).format(new Date(v)); }
function formatDay(v: string, includeYear = false) { return new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "2-digit", ...(includeYear ? { year: "numeric" } : {}), timeZone: "Asia/Bangkok" }).format(new Date(v)); }
function reportDateKey(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value || "00";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
