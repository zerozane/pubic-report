import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  ExternalLink,
  Eye,
  Heart,
  MessageSquare,
  Search,
  Sparkles,
  TrendingUp
} from "lucide-react";
import type { DashboardConfig, Platform, Report, ReportEvidence } from "@/lib/types";
import MentionsExplorer from "./MentionsExplorer";
import PrintButton from "./PrintButton";

export default function SocialDashboard({ report }: { report: Report }) {
  const dashboard = report.dashboard || buildFallbackDashboard(report);
  const timelineHighlights = buildTimelineHighlights(dashboard);
  const stats = buildStats(report);
  const platformRows = buildPlatformRows(report, stats.totalRecords);
  const topicRows = buildTopicRows(report);
  const concernRows = buildConcernRows(report);
  const opportunityRows = buildOpportunityRows(report);
  const topQuotes = report.evidence
    .filter((item) => item.recordType === "comment")
    .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
    .slice(0, 3);

  return (
    <div className="lg-page lg-editorial-page">
      <header className="lg-topbar lg-report-topbar">
        <div className="lg-container lg-topbar-inner">
          <Link className="lg-brand lg-report-brand" href={`/reports/${report.slug}`}>
            <span>{dashboard.brandMark || "LG"}</span>
            <div>
              <strong>{dashboard.brandName || "LA GLACE"}</strong>
              <small>Social Listening Report</small>
            </div>
          </Link>

          <nav className="lg-report-tabs" aria-label="Report sections">
            <a href="#overview" className="active">ภาพรวม</a>
            <Link href={`/reports/${report.slug}/quality`}>คุณภาพสินค้า</Link>
            <a href="#stream">เสียงผู้ชม</a>
            <Link href={`/reports/${report.slug}/evidence`}>หลักฐาน</Link>
            <Link href={`/reports/${report.slug}/engagement`}>Engagement</Link>
          </nav>

          <div className="lg-top-actions lg-report-actions">
            <span className="lg-live"><i />{formatDateRange(report)}</span>
            <PrintButton href={`/reports/${report.slug}/summary?print=1`} />
          </div>
        </div>
      </header>

      <main className="lg-container lg-main lg-report-main">
        <section className="lg-editorial-hero" id="overview">
          <div className="lg-hero-copy">
            <p className="lg-kicker">รายงานเสียงผู้บริโภคจากบทสนทนาสาธารณะ</p>
            <h1>คุณภาพสินค้า LA GLACE<br />ผ่านเสียงผู้บริโภค</h1>
            <p className="lg-hero-lede">
              ภาพรวมนี้จัดข้อมูลตามสินค้า ประเด็นคุณภาพ และเสียงตอบรับ เพื่อให้เห็นว่าผู้บริโภคชอบอะไร พบปัญหาตรงไหน และควรตรวจสอบเรื่องใดต่อ
            </p>
            <div className="lg-hero-meta">
              <div>
                <small>พบคอนเทนต์และข้อความ</small>
                <strong>{formatNumber(stats.totalRecords)}</strong>
                <span>รายการ</span>
              </div>
              <div>
                <small>เสียงตอบรับที่วัดได้</small>
                <strong>{formatNumber(stats.classified)}</strong>
                <span>ข้อความ</span>
              </div>
              <div>
                <small>ยอดปฏิสัมพันธ์รวม</small>
                <strong>{formatCompact(stats.engagement)}</strong>
                <span>engagement</span>
              </div>
            </div>
          </div>

          <aside className="lg-sentiment-panel">
            <p>การตอบรับจากผู้ชม</p>
            <strong>{stats.positiveRate}%</strong>
            <span>ข้อความเชิงบวก</span>
            <p className="lg-sentiment-copy">
              {formatNumber(stats.positive)} จาก {formatNumber(stats.classified)} ข้อความที่จำแนก sentiment ได้ เป็นเสียงเชิงบวกจากข้อมูลทั้งหมด {formatNumber(stats.totalRecords)} รายการ
            </p>
            <SentimentStack positive={stats.positive} neutral={stats.neutral} negative={stats.negative} />
            <div className="lg-sentiment-legend">
              <span><i className="pos" />บวก <b>{formatNumber(stats.positive)}</b></span>
              <span><i className="neu" />กลาง <b>{formatNumber(stats.neutral)}</b></span>
              <span><i className="neg" />ลบ <b>{formatNumber(stats.negative)}</b></span>
            </div>
            <a className="lg-primary-link" href="#stream">ดูเสียงผู้ชมทั้งหมด <ArrowRight size={16} /></a>
          </aside>
        </section>

        <section className="lg-evidence-search" id="evidence-search">
          <div>
            <h2>ต่อจากผลนี้ - ค้นหาหลักฐานจากเสียงผู้ชม</h2>
            <p>ค้นด้วยคำถาม หัวข้อ หรือชื่อที่จำได้ แล้วเปิดกลับถึงต้นทางในส่วนหลักฐานด้านล่าง</p>
          </div>
          <a href="#stream" className="lg-search-pill">
            <Search size={18} />
            <span>ค้นหาสิ่งที่ผู้ชมพูดถึง เช่น ลิปไอติม บลัชดำ ของหมด ของปลอม</span>
            <b>ค้นหาหลักฐาน</b>
          </a>
        </section>

        <section className="lg-section">
          <div className="lg-section-head lg-editorial-head">
            <div>
              <h2>ตัวเลขสำคัญของรอบนี้</h2>
              <p>นับเป็นข้อความและรายการ ไม่ใช่จำนวนผู้ชม เพื่อเปิดหลักฐานกลับไปตรวจได้</p>
            </div>
          </div>
          <div className="lg-metric-grid">
            <MetricCard label="เกี่ยวกับ La Glace รอบนี้" value={formatNumber(stats.totalRecords)} caption="โพสต์ บทความ และความคิดเห็นที่เชื่อมกับแบรนด์" />
            <MetricCard label="ต้นทางที่ตรวจสอบได้" value={formatNumber(stats.sources)} caption="โพสต์ วิดีโอ และบทความต้นทางที่ไม่ซ้ำกัน" />
            <MetricCard label="ความคิดเห็น" value={formatNumber(stats.comments)} caption="เสียงผู้ชมที่นำมาวิเคราะห์ sentiment และหัวข้อ" />
            <MetricCard label="เสียงตอบรับที่วัดได้" value={formatNumber(stats.classified)} caption="ข้อความที่นำมาจัดกลุ่มเชิงบวก กลาง และลบ" />
          </div>
          <div className="lg-wide-metrics">
            <article>
              <Eye size={22} />
              <div>
                <span>ยอดรับชมที่บันทึกได้</span>
                <strong>{formatCompact(stats.views)}</strong>
                <small>รวมจากรายการที่มีข้อมูล views</small>
              </div>
            </article>
            <article>
              <Heart size={22} />
              <div>
                <span>ยอดปฏิสัมพันธ์ที่บันทึกได้</span>
                <strong>{formatCompact(stats.engagement)}</strong>
                <small>likes, replies, shares และ engagement ที่แนบมา</small>
              </div>
            </article>
          </div>
        </section>

        <section className="lg-section lg-timeline-section">
          <div className="lg-section-head lg-editorial-head">
            <div>
              <span>Timeline ของข้อความที่เก็บได้</span>
              <h2>วันไหนมีคนพูดถึง La Glace มากที่สุด</h2>
            </div>
          </div>
          <div className="lg-timeline-layout">
            <article className="lg-chart-card lg-editorial-card">
              <div className="lg-chart-title">
                <h3>จำนวนข้อความรายวัน</h3>
                <p>แต่ละแท่งคือจำนวนข้อความที่พบในวันนั้น แบ่งสีตาม sentiment ที่ระบบจัดกลุ่มได้</p>
              </div>
              <TimelineBars dashboard={dashboard} />
            </article>
            <aside className="lg-period-list">
              <h3>วันที่ข้อความพุ่ง</h3>
              {timelineHighlights.map((item) => (
                <article key={item.label}>
                  <b>{item.label}</b>
                  <p>{item.description}</p>
                </article>
              ))}
            </aside>
          </div>
        </section>

        <section className="lg-section" id="channels">
          <div className="lg-section-head lg-editorial-head">
            <div>
              <span>ช่องทางที่พบข้อความ</span>
              <h2>แต่ละช่องทางตอบคนละคำถาม</h2>
              <p>เปรียบเทียบด้วยจำนวนข้อความหน่วยเดียวกัน ไม่ใช่ยอดปฏิสัมพันธ์ข้ามแพลตฟอร์ม</p>
            </div>
          </div>
          <div className="lg-channel-table">
            {platformRows.map((row) => (
              <div className="lg-channel-row" key={row.platform}>
                <strong>{row.platform}</strong>
                <div className="lg-channel-bar"><i style={{ width: `${row.percent}%` }} /></div>
                <b>{formatNumber(row.total)}</b>
                <span>{formatNumber(row.positive)} บวก</span>
                <span>{row.positiveRate}% เชิงบวก</span>
                <em>{row.role}</em>
              </div>
            ))}
          </div>
        </section>

        <section className="lg-section">
          <div className="lg-section-head lg-editorial-head">
            <div>
              <span>หัวข้อที่ผู้ชมพูดถึงมาก</span>
              <h2>ประเด็นที่ผู้บริโภคพูดถึงเกี่ยวกับสินค้า</h2>
              <p>ดูหลักฐานของแต่ละประเด็นเพื่ออ่านข้อความจริงและบริบทต้นทาง</p>
            </div>
          </div>
          <div className="lg-topic-ranking" id="product-quality">
            {topicRows.slice(0, 6).map((topic, index) => (
              <article key={topic.name}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{topic.name}</h3>
                <div><i style={{ width: `${topic.percent}%` }} /></div>
                <p><b>{formatNumber(topic.count)}</b> ข้อความ · เชิงบวก {topic.positiveRate}%</p>
                <a href="#stream" aria-label={`ดูหลักฐาน ${topic.name}`}><ExternalLink size={15} /></a>
              </article>
            ))}
          </div>
        </section>

        <section className="lg-section lg-two-columns">
          <article>
            <span>ประเด็นที่ควรตรวจสอบ</span>
            <h2>มีประเด็นอะไรที่ควรตรวจสอบ</h2>
            <p>รวมข้อความเชิงลบหรือข้อกังวลที่อาจกระทบประสบการณ์และความน่าเชื่อถือของสินค้า</p>
            <div className="lg-brief-list">
              {concernRows.map((item) => (
                <div key={item.title}>
                  <b>{item.title}</b>
                  <span>{formatNumber(item.count)} ข้อความที่พบ</span>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </article>
          <article>
            <span>โอกาสจากเสียงผู้บริโภค</span>
            <h2>มีอะไรที่ผู้บริโภคสนใจและนำไปต่อยอดได้</h2>
            <p>รวมสิ่งที่ผู้บริโภคชื่นชอบ สนใจ หรือถามถึง ซึ่งนำไปต่อยอดด้านสินค้า คอนเทนต์ และการขายได้</p>
            <div className="lg-brief-list">
              {opportunityRows.map((item) => (
                <div key={item.title}>
                  <b>{item.title}</b>
                  <span>{formatNumber(item.count)} ข้อความ</span>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="lg-section lg-quote-section">
          <div>
            <span>ตัวอย่างเสียงจริงจากผู้บริโภค</span>
            <h2>ข้อความจริงที่ช่วยยืนยันประเด็นคุณภาพสินค้า</h2>
            <p>ตัวอย่างข้อความจริงที่ช่วยยืนยันประเด็นด้านคุณภาพสินค้าและความรู้สึกของผู้บริโภค</p>
          </div>
          <div className="lg-quote-grid">
            {topQuotes.map((item) => (
              <blockquote key={item.id}>
                <p>{item.text}</p>
                <footer>{item.platform} · {formatShortDate(item.publishedAt)}</footer>
              </blockquote>
            ))}
          </div>
        </section>

        <MentionsExplorer evidence={report.evidence} />

        <footer className="lg-footer lg-editorial-footer">
          <p>ดาวน์โหลดรายงานวิเคราะห์ฉบับเต็ม หรือเปิดหน้าหลักฐานเพื่อค้นหาและตรวจข้อความต้นทาง</p>
          <div>
            <PrintButton href={`/reports/${report.slug}/summary?print=1`} />
            <a href="#stream"><MessageSquare size={17} />เปิดหน้าเสียงผู้ชม</a>
          </div>
        </footer>
      </main>
    </div>
  );
}

function MetricCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <article className="lg-editorial-card lg-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{caption}</p>
      <a href="#stream">ดูหลักฐาน <ArrowRight size={14} /></a>
    </article>
  );
}

function SentimentStack({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  const total = Math.max(positive + neutral + negative, 1);
  return (
    <div className="lg-sentiment-stack" aria-label="Sentiment distribution">
      <span className="pos" style={{ width: `${(positive / total) * 100}%` }} />
      <span className="neu" style={{ width: `${(neutral / total) * 100}%` }} />
      <span className="neg" style={{ width: `${(negative / total) * 100}%` }} />
    </div>
  );
}

function buildTimelineHighlights(dashboard: DashboardConfig) {
  const rows = dashboard.timeline.total
    .map((value, index) => ({
      label: dashboard.timeline.labels[index] || `Day ${index + 1}`,
      value,
      positive: dashboard.timeline.positive[index] ?? 0,
      negative: dashboard.timeline.negative[index] ?? 0
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return rows.map((row, index) => {
    const neutral = Math.max(row.value - row.positive - row.negative, 0);
    return {
      label: `${index + 1}. ${row.label}`,
      description: `${formatNumber(row.value)} ข้อความทั้งหมด · Positive ${formatNumber(row.positive)} · Neutral ${formatNumber(neutral)} · Negative ${formatNumber(row.negative)}`
    };
  });
}
function TimelineBars({ dashboard }: { dashboard: DashboardConfig }) {
  const max = Math.max(...dashboard.timeline.total, 1);
  const total = dashboard.timeline.total.reduce((sum, value) => sum + value, 0);
  const peakIndexes = new Set(dashboard.timeline.total.map((value, index) => value === max ? index : -1).filter((index) => index >= 0));
  return (
    <div className="lg-timeline-chart">
      <div className="lg-timeline-summary">
        <span><b>{formatNumber(total)}</b> ข้อความใน timeline นี้</span>
        <span>สูงสุด <b>{formatNumber(max)}</b> ข้อความ/วัน</span>
      </div>
      <div className="lg-sentiment-legend" aria-label="Sentiment legend">
        <span><i className="pos" />Positive</span>
        <span><i className="neu" />Neutral</span>
        <span><i className="neg" />Negative</span>
      </div>
      <div className="lg-editorial-bars">
        {dashboard.timeline.total.map((value, index) => {
          const positive = dashboard.timeline.positive[index] ?? Math.round(value * 0.7);
          const negative = dashboard.timeline.negative[index] ?? 0;
          const neutral = Math.max(value - positive - negative, 0);
          return (
            <div className={peakIndexes.has(index) ? "peak" : ""} key={`${dashboard.timeline.labels[index]}-${index}`} title={`${dashboard.timeline.labels[index]}: ${formatNumber(value)} records`}>
              {peakIndexes.has(index) ? <b>{formatNumber(value)}</b> : null}
              <span style={{ height: `${Math.max((value / max) * 100, 4)}%` } as CSSProperties}>
                <i className="pos" style={{ height: `${(positive / Math.max(value, 1)) * 100}%` }} />
                <i className="neu" style={{ height: `${(neutral / Math.max(value, 1)) * 100}%` }} />
                <i className="neg" style={{ height: `${(negative / Math.max(value, 1)) * 100}%` }} />
              </span>
              <em>{dashboard.timeline.labels[index]}</em>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildStats(report: Report) {
  const sources = countAuditableSources(report.evidence);
  const comments = report.evidence.filter((item) => item.recordType === "comment");
  const positive = report.evidence.filter((item) => item.sentiment === "positive").length;
  const neutral = report.evidence.filter((item) => item.sentiment === "neutral").length;
  const negative = report.evidence.filter((item) => item.sentiment === "negative").length;
  const classified = positive + neutral + negative;
  const engagement = report.evidence.reduce((sum, item) => sum + (item.engagement || item.metrics.likes || 0), 0);
  const views = report.evidence.reduce((sum, item) => sum + (item.metrics.views || 0), 0);

  return {
    totalRecords: report.evidence.length,
    sources,
    comments: comments.length,
    positive,
    neutral,
    negative,
    classified,
    positiveRate: percent(positive, classified),
    negativeRate: percent(negative, classified),
    engagement,
    views
  };
}

function countAuditableSources(records: ReportEvidence[]) {
  const sourceKeys = records.map(sourceKey).filter((value): value is string => Boolean(value));
  return new Set(sourceKeys).size;
}

function sourceKey(item: ReportEvidence) {
  if (item.parentPostId) return `${item.platform}:${item.parentPostId}`;
  if (item.recordType === "post" && item.sourceId) return `${item.platform}:${item.sourceId}`;
  if (item.sourceUrl) return `${item.platform}:${normalizeSourceUrl(item.sourceUrl)}`;
  return null;
}

function normalizeSourceUrl(value: string) {
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.split("?")[0].replace(/\/$/, "");
  }
}
function buildPlatformRows(report: Report, totalRecords: number) {
  const roles: Record<string, string> = {
    TikTok: "พื้นที่สนทนาหลักของรอบนี้",
    Instagram: "ภาพความประทับใจและช่วงเวลาสำคัญ",
    Facebook: "บริบทคอมมูนิตี้และคำขอ",
    X: "ข้อกังวลที่ควรตรวจสอบ",
    YouTube: "พื้นที่รีวิวและวิดีโอที่ค้นพบภายหลัง"
  };
  const platforms = Array.from(new Set(report.evidence.map((item) => item.platform)));
  return platforms.map((platform) => {
    const records = report.evidence.filter((item) => item.platform === platform);
    const positive = records.filter((item) => item.sentiment === "positive").length;
    const classified = records.filter((item) => item.sentiment).length;
    return {
      platform,
      total: records.length,
      positive,
      positiveRate: percent(positive, classified),
      percent: Math.max((records.length / Math.max(totalRecords, 1)) * 100, 2),
      role: roles[platform] || "บริบทของข้อมูลชุดนี้"
    };
  }).sort((a, b) => b.total - a.total);
}

function buildTopicRows(report: Report) {
  const map = new Map<string, { count: number; positive: number; classified: number }>();
  for (const item of report.evidence) {
    for (const topic of item.topics || []) {
      const entry = map.get(topic) || { count: 0, positive: 0, classified: 0 };
      entry.count += 1;
      if (item.sentiment) entry.classified += 1;
      if (item.sentiment === "positive") entry.positive += 1;
      map.set(topic, entry);
    }
  }
  const max = Math.max(...Array.from(map.values()).map((item) => item.count), 1);
  return Array.from(map.entries())
    .map(([name, item]) => ({
      name,
      count: item.count,
      positiveRate: percent(item.positive, item.classified),
      percent: Math.max((item.count / max) * 100, 4)
    }))
    .sort((a, b) => b.count - a.count);
}

function buildConcernRows(report: Report) {
  const issues = report.evidence.filter((item) => item.isIssue || item.sentiment === "negative");
  return [
    {
      title: "สินค้าปลอมและความน่าเชื่อถือ",
      count: countByNeedle(issues, ["ปลอม", "แท้", "trust", "ก๊อป"]),
      description: "ข้อความที่พูดถึงแหล่งซื้อ ความแท้ และร้านที่ควรตรวจสอบ"
    },
    {
      title: "ของขาดหรือหาซื้อยาก",
      count: countByNeedle(issues, ["หมด", "stock", "restock", "สต็อก", "หาซื้อ"]),
      description: "สะท้อน friction ระหว่างความต้องการซื้อกับความพร้อมของสินค้า"
    },
    {
      title: "ฟีดแบ็กเรื่องบรรจุภัณฑ์",
      count: countByNeedle(issues, ["แพ็ก", "ตลับ", "หัวแปรง", "เลอะ"]),
      description: "ประเด็นเฉพาะจุดที่ควรส่งต่อให้ทีมสินค้าอ่านต่อ"
    }
  ].map((item) => ({ ...item, count: item.count || Math.min(issues.length, 1) }));
}

function buildOpportunityRows(report: Report) {
  const positives = report.evidence.filter((item) => item.sentiment === "positive");
  return [
    {
      title: "รีวิวและหลักฐานคุณภาพสินค้า",
      count: countByNeedle(positives, ["รีวิว", "wear", "ติดทน", "สวอช", "เนื้อ"]),
      description: "ใช้ต่อยอดเป็น social proof สำหรับหน้าขายและคอนเทนต์สั้น"
    },
    {
      title: "ดีไซน์และแพ็กเกจจิ้ง",
      count: countByNeedle(positives, ["Y2K", "แพ็ก", "ตลับ", "aesthetic", "shelf"]),
      description: "ภาพลักษณ์สินค้าเป็นแรงขับให้เกิด UGC และการแชร์ต่อ"
    },
    {
      title: "พิกัดซื้อและแผน restock",
      count: countByNeedle(report.evidence, ["ซื้อ", "พิกัด", "Eveandboy", "restock", "สต็อก"]),
      description: "คำถามเชิงซื้อควรถูกแปลงเป็น flow พาไปช่องทางขายที่ชัดเจน"
    }
  ];
}

function countByNeedle(records: ReportEvidence[], needles: string[]) {
  return records.filter((item) => {
    const haystack = [item.text, item.detail, item.intent, ...(item.topics || []), ...(item.matchedKeywords || [])].join(" ").toLowerCase();
    return needles.some((needle) => haystack.includes(needle.toLowerCase()));
  }).length;
}

function formatDateRange(report: Report) {
  return `${formatShortDate(report.period.from)}-${formatShortDate(report.period.to)}`;
}

function formatShortDate(value: string) {
  if (!value || Number.isNaN(Date.parse(value))) return value || "-";
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", timeZone: "Asia/Bangkok" }).format(new Date(value));
}

function formatNumber(value: number) {
  return value.toLocaleString("th-TH");
}

function formatCompact(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 100000 ? 0 : 1)}K`;
  return formatNumber(value);
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function buildFallbackDashboard(report: Report): DashboardConfig {
  const comments = report.evidence.filter((item) => item.recordType === "comment");
  return {
    eyebrow: "Social Listening Report",
    headline: report.title,
    description: report.summary,
    brandMark: "LG",
    brandName: "LA GLACE",
    badge: "รายงานเสียงผู้บริโภค",
    kpis: [
      { label: "Mentions", value: comments.length.toLocaleString("th-TH"), caption: "Classified comments", tone: "pink" },
      { label: "Evidence", value: report.evidence.length.toLocaleString("th-TH"), caption: "Total records", tone: "mint" }
    ],
    ingestion: {
      statusText: report.status,
      window: `${report.period.from} - ${report.period.to}`,
      pipelineSpeed: "-",
      dataFreshness: report.collectedAt || "-",
      monitoredKeywords: Array.from(new Set(report.evidence.flatMap((item) => item.topics))).slice(0, 8),
      connectedSources: [],
      topKeywords: []
    },
    timeline: { labels: [], total: [], positive: [], negative: [], events: [] },
    pillars: []
  };
}





