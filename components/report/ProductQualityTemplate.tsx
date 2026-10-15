import Link from "next/link";
import { CheckCircle2, CircleAlert, FileText, Star } from "lucide-react";
import ProductQualityExplorer from "@/components/report/ProductQualityExplorer";
import ProductQualityComparison from "@/components/report/ProductQualityComparison";
import type { Report } from "@/lib/types";
import type { ProductQualityProduct, ProductQualityReport, ProductQualityReview } from "@/lib/productQuality";

export default function ProductQualityTemplate({
  report,
  quality,
  reviews,
}: {
  report: Report;
  quality: ProductQualityReport | null;
  reviews: ProductQualityReview[];
}) {
  if (!quality) return <MissingQualityData report={report} />;

  const { totals } = quality;
  const topTopic = quality.topics[0];

  return (
    <div className="lg-page lg-editorial-page lg-quality-page">
      <header className="lg-topbar lg-report-topbar">
        <div className="lg-container lg-topbar-inner">
          <Link className="lg-brand lg-report-brand" href={`/reports/${report.slug}`}>
            <span>{report.dashboard?.brandMark || "LG"}</span>
            <div><strong>{report.dashboard?.brandName || "LA GLACE"}</strong><small>Product Quality Report</small></div>
          </Link>
          <nav className="lg-report-tabs" aria-label="Report sections">
            <Link href={`/reports/${report.slug}`}>ภาพรวม</Link>
            <Link href={`/reports/${report.slug}/quality`} className="active">คุณภาพสินค้า</Link>
            <Link href={`/reports/${report.slug}/engagement`}>Engagement</Link>
          </nav>
          <span className="lg-live"><i />TikTok Shop · TH</span>
        </div>
      </header>

      <main className="lg-container lg-main lg-quality-main">
        <section className="lg-quality-hero">
          <div>
            <p className="lg-kicker">PRODUCT QUALITY / TIKTOK SHOP</p>
            <h1>คุณภาพสินค้า<br />จากเสียงผู้บริโภค</h1>
            <p>สรุปรีวิวสินค้า LA GLACE จำนวน {formatNumber(totals.reviews)} รายการ แยกตามสินค้า หัวข้อคุณภาพ ปัญหาที่ควรตรวจสอบ และหลักฐานจากข้อความจริง</p>
          </div>
          <div className="lg-quality-status">
            <span>ขอบเขตข้อมูล</span>
            <strong>{quality.products.length} สินค้า · {formatNumber(totals.reviews)} รีวิว</strong>
            <small>เก็บจาก TikTok Shop ประเทศไทย รวม {formatNumber(totals.reviews)} รีวิว จาก {quality.products.length} สินค้า เรียงตามรีวิวล่าสุด</small>
          </div>
        </section>

        <section className="lg-quality-kpis" aria-label="ภาพรวมคุณภาพสินค้า">
          <QualityKpi label="รีวิวทั้งหมด" value={formatNumber(totals.reviews)} detail={`จาก ${quality.products.length} สินค้า`} />
          <QualityKpi label="คะแนนเฉลี่ย" value={`${totals.averageRating ?? "—"} / 5`} detail="จาก rating ที่ผู้ซื้อให้" tone="positive" />
          <QualityKpi label="รีวิว 5 ดาว" value={formatPercent(totals.fiveStarReviews, totals.reviews)} detail={`${formatNumber(totals.fiveStarReviews)} รายการ`} tone="positive" />
          <QualityKpi label="Verified purchase" value={formatPercent(totals.verifiedPurchases, totals.reviews)} detail="รีวิวที่ยืนยันการซื้อ" tone="neutral" />
        </section>

        <section className="lg-quality-section">
          <SectionHeading eyebrow="01 / PRODUCT COMPARISON" title="เปรียบเทียบคุณภาพแยกตามสินค้า" description="ดูคะแนน ปริมาณรีวิว สัญญาณปัญหา และหัวข้อที่ผู้บริโภคพูดถึงของแต่ละผลิตภัณฑ์" />
          <ProductQualityComparison products={quality.products} />
        </section>

        <section className="lg-quality-section">
          <SectionHeading eyebrow="02 / QUALITY TOPICS" title="หัวข้อคุณภาพที่ถูกพูดถึง" description="หัวข้อถูกจับจากข้อความรีวิวจริง แยกจากคะแนนดาว เพื่อไม่ให้คำชมถูกนับเป็นคุณภาพโดยอัตโนมัติ" />
          <div className="lg-quality-topic-list">
            {quality.topics.length ? quality.topics.slice(0, 10).map((topic) => (
              <div className="lg-quality-topic" key={topic.name}>
                <div><strong>{topic.name}</strong><span>{formatNumber(topic.count)} รีวิว</span></div>
                <div className="lg-quality-track"><i style={{ width: `${topic.percent}%` }} /></div>
                <small>{formatNumber(topic.negative)} รายการมีสัญญาณต้องตรวจสอบ</small>
              </div>
            )) : <EmptyState title="ยังไม่มีหัวข้อคุณภาพ" description="ยังไม่พบคำที่จับคู่กับหัวข้อคุณภาพในชุดข้อมูลนี้" />}
          </div>
        </section>

        <section className="lg-quality-section lg-quality-context-grid">
          <article className="lg-quality-panel issue">
            <SectionHeading eyebrow="03 / WATCHLIST" title="ประเด็นที่ต้องตรวจสอบ" description="ใช้เป็นคิวสำหรับอ่านซ้ำ ไม่ใช่การสรุปว่าทุกรายการเป็นปัญหา" />
            <div className="lg-quality-list">
              <QualityListItem href={`/reports/${report.slug}/quality?rating=low#quality-explorer`} icon={<CircleAlert size={17} />} title="รีวิวคะแนนต่ำ 1–2 ดาว" value={totals.lowRatingReviews} detail={`${formatPercent(totals.lowRatingReviews, totals.reviews)} ของรีวิว · กรองจาก rating 1–2 ดาว`} />
              <QualityListItem href={`/reports/${report.slug}/quality?signal=watch#quality-explorer`} icon={<CircleAlert size={17} />} title="รีวิวที่มีคำสัญญาณปัญหา" value={totals.issueReviews} detail={`${formatPercent(totals.issueReviews, totals.reviews)} ของรีวิว · พบคำหรือวลีปัญหาในข้อความจริง`} />
              <QualityListItem href={`/reports/${report.slug}/quality?signal=human#quality-explorer`} icon={<CircleAlert size={17} />} title="ข้อความที่ควรให้คนตรวจ" value={totals.humanReview} detail={`${formatPercent(totals.humanReview, totals.reviews)} ของรีวิว · ข้อความสั้นหรือจับหัวข้อไม่ได้`} />
            </div>
          </article>
          <article className="lg-quality-panel opportunity">
            <SectionHeading eyebrow="04 / OPPORTUNITIES" title="เสียงที่ใช้ต่อยอดได้" description="หัวข้อที่มีข้อมูลมากเหมาะสำหรับทำ product proof, FAQ และคอนเทนต์รีวิว" />
            <div className="lg-quality-list">
              <QualityListItem href={`/reports/${report.slug}/quality?verified=1#quality-explorer`} icon={<CheckCircle2 size={17} />} title="รีวิวที่ยืนยันการซื้อ" value={totals.verifiedPurchases} detail={`${formatPercent(totals.verifiedPurchases, totals.reviews)} ของรีวิว · หลักฐานจากผู้ซื้อจริง`} />
              <QualityListItem href={`/reports/${report.slug}/quality?rating=5#quality-explorer`} icon={<Star size={17} />} title="รีวิว 5 ดาว" value={totals.fiveStarReviews} detail={`${formatPercent(totals.fiveStarReviews, totals.reviews)} ของรีวิว · ใช้คัดข้อความชมและจุดเด่นสินค้า`} />
              <QualityListItem href={topTopic ? `/reports/${report.slug}/quality?topic=${encodeURIComponent(topTopic.name)}#quality-explorer` : undefined} icon={<FileText size={17} />} title="หัวข้อเด่นที่สุด" value={topTopic?.count || 0} detail={topTopic ? `${topTopic.name} · กดเพื่อดูรีวิวต้นทาง` : "ยังไม่มีหัวข้อ"} />
            </div>
          </article>
        </section>

        <section className="lg-quality-section">
          <div className="lg-quality-evidence-heading">
            <SectionHeading eyebrow="05 / CONSUMER VOICE" title="ตัวอย่างข้อความจริงจากผู้บริโภค" description="แสดงหลักฐานตัวอย่างต่อสินค้า เพื่อให้เห็นทั้งจุดเด่นและประเด็นที่ควรอ่านต่อ" />
            <span className="lg-quality-inline-note">คัดเลือกจากรีวิวสินค้าทั้ง {quality.evidence.length} รายการ</span>
          </div>
          <div className="lg-quality-quotes">
            {quality.evidence.map((item) => (
              <blockquote key={item.id}>
                <div className="lg-quality-quote-meta"><strong>{item.productName}</strong><span>{item.rating ?? "—"} ★</span></div>
                <p>{item.text}</p>
                {item.productUrl && <a className="lg-quality-quote-source-link" href={item.productUrl} target="_blank" rel="noreferrer">ดูสินค้าต้นทาง ↗</a>}
                <footer>{item.topics.slice(0, 2).join(" · ") || "รอจัดหัวข้อ"} · {item.verifiedPurchase ? "Verified purchase" : "ไม่ระบุ"}</footer>
              </blockquote>
            ))}
          </div>
        </section>

        <ProductQualityExplorer reviews={reviews} />

        <section className="lg-quality-method">
          <span>ความรู้สึก: 5 ดาว = เชิงบวก · 3–4 ดาว = เป็นกลาง · 1–2 ดาว = เชิงลบ</span>
          <strong>วิธีอ่านข้อมูลชุดนี้</strong>
          <span>rating เป็นสัญญาณหลัก</span>
          <span>จับหัวข้อจากข้อความจริง</span>
          <span>แยกปัญหาร้านค้าออกจากตัวสินค้า</span>
          <span>รีวิวสั้นส่งตรวจซ้ำ</span>
        </section>
      </main>
    </div>
  );
}

function ProductCard({ product }: { product: ProductQualityProduct }) {
  return (
    <article className="lg-quality-product-card">
      <span>{product.category}</span>
      <h3>{product.sourceName}</h3>
      <small className="lg-quality-product-label">{product.label}</small>
      <div className="lg-quality-product-summary">
        <strong>{product.averageRating ?? "—"} / 5</strong>
        <small>{formatNumber(product.count)} รีวิว · 5 ดาว {product.fiveStarPercent}%</small>
      </div>
      <div className="lg-quality-rating-bar">
        {product.ratingDistribution.map((item) => <i key={item.rating} style={{ width: `${Math.max((item.count / Math.max(product.count, 1)) * 100, 1)}%` }} title={`${item.rating} ดาว: ${item.count}`} />)}
      </div>
      <small>คะแนน 1–2 ดาว {product.lowRatingPercent}% · สัญญาณต้องตรวจ {product.issueCount}</small>
      <div className="lg-quality-card-topics">
        {product.topics.slice(0, 3).map((topic) => <span key={topic.name}>{topic.name} {topic.count}</span>)}
      </div>
    </article>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="lg-quality-heading"><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>;
}

function QualityKpi({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail: string; tone?: string }) {
  return <article className={`lg-quality-kpi ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function QualityListItem({ href, icon, title, value, detail }: { href?: string; icon: React.ReactNode; title: string; value: number; detail: string }) {
  const content = <><span>{icon}</span><div><strong>{title}</strong><small>{detail}</small></div><b>{formatNumber(value)}</b></>;
  return href ? <Link className="lg-quality-list-item" href={href} title="เปิดรายการรีวิวที่เกี่ยวข้อง">{content}</Link> : <div className="lg-quality-list-item">{content}</div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="lg-quality-empty"><strong>{title}</strong><p>{description}</p></div>;
}

function MissingQualityData({ report }: { report: Report }) {
  return <div className="lg-page lg-editorial-page"><main className="lg-container lg-main lg-quality-main"><section className="lg-quality-empty"><strong>ยังไม่มีข้อมูล Product Quality</strong><p>ต้องรัน Normalize รีวิวสินค้าและสร้างไฟล์คุณภาพก่อนเปิดรายงาน {report.title}</p></section></main></div>;
}

function formatNumber(value: number) { return value.toLocaleString("th-TH"); }
function formatPercent(value: number, total: number) { return `${((value / Math.max(total, 1)) * 100).toFixed(1)}%`; }
