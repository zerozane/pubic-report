import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, FileText, PackageSearch } from "lucide-react";
import type { Report, ReportEvidence } from "@/lib/types";

type QualityEvidence = ReportEvidence & {
  productCategory?: string;
  productName?: string;
  qualityTopics?: string[];
  qualityIssues?: string[];
  confidence?: number;
  needsHumanReview?: boolean;
};

const qualityTopicLabels: Record<string, string> = {
  texture: "เนื้อสัมผัส",
  lasting_power: "ความติดทน",
  shade_color: "สีและเฉดสี",
  skin_reaction: "การระคายเคือง",
  packaging: "บรรจุภัณฑ์",
  product_quality: "คุณภาพสินค้า",
  price_value: "ราคาและความคุ้มค่า",
  availability: "ความพร้อมของสินค้า"
};

export default function ProductQualityTemplate({ report }: { report: Report }) {
  const records = report.evidence as QualityEvidence[];
  const comments = records.filter((item) => item.recordType === "comment");
  const classified = comments.filter((item) => item.sentiment);
  const positive = classified.filter((item) => item.sentiment === "positive").length;
  const negative = classified.filter((item) => item.sentiment === "negative").length;
  const issues = comments.filter((item) => item.isIssue || item.sentiment === "negative");
  const products = getProducts(records);
  const topics = getQualityTopics(records);
  const evidence = comments.filter((item) => item.text.trim()).sort((a, b) => (b.engagement || 0) - (a.engagement || 0)).slice(0, 3);
  const trend = getDailyTrend(comments);
  const platforms = getPlatformContext(records);

  return (
    <div className="lg-page lg-editorial-page lg-quality-page">
      <header className="lg-topbar lg-report-topbar">
        <div className="lg-container lg-topbar-inner">
          <Link className="lg-brand lg-report-brand" href={`/reports/${report.slug}`}>
            <span>{report.dashboard?.brandMark || "LG"}</span>
            <div><strong>{report.dashboard?.brandName || "LA GLACE"}</strong><small>Product Quality Template</small></div>
          </Link>
          <nav className="lg-report-tabs" aria-label="Report sections">
            <Link href={`/reports/${report.slug}`}>ภาพรวม</Link>
            <Link href={`/reports/${report.slug}/quality`} className="active">คุณภาพสินค้า</Link>
            <Link href={`/reports/${report.slug}/evidence`}>หลักฐาน</Link>
            <Link href={`/reports/${report.slug}/engagement`}>Engagement</Link>
          </nav>
          <span className="lg-live"><i />{formatDateRange(report)}</span>
        </div>
      </header>

      <main className="lg-container lg-main lg-quality-main">
        <section className="lg-quality-hero">
          <div>
            <p className="lg-kicker">PRODUCT QUALITY</p>
            <h1>คุณภาพสินค้า<br />ผ่านเสียงผู้บริโภค</h1>
            <p>โครงหน้านี้จัดลำดับจากสินค้า ประเด็นคุณภาพ ปัญหาที่ควรตรวจสอบ และข้อความจริง โดยเตรียมช่องข้อมูลสำหรับการจำแนกจาก JEV ในขั้นถัดไป</p>
          </div>
          <div className="lg-quality-status">
            <span>สถานะ Template</span>
            <strong>พร้อมรับผลวิเคราะห์</strong>
            <small>ยังใช้ข้อมูลรายงานปัจจุบันได้ แม้ยังไม่มี product classification</small>
          </div>
        </section>

        <section className="lg-quality-kpis" aria-label="ภาพรวมคุณภาพสินค้า">
          <QualityKpi label="ข้อความที่วิเคราะห์" value={formatNumber(classified.length)} detail="ข้อความที่มี sentiment" />
          <QualityKpi label="เสียงเชิงบวก" value={formatNumber(positive)} detail="จากข้อความที่จำแนกได้" tone="positive" />
          <QualityKpi label="ประเด็นที่ควรตรวจสอบ" value={formatNumber(issues.length)} detail="negative หรือ flagged" tone="negative" />
          <QualityKpi label="สินค้าที่จับคู่ได้" value={formatNumber(products.length)} detail={products.length ? "จาก Product Catalog" : "รอ Product Catalog / JEV"} tone="neutral" />
        </section>

        <section className="lg-quality-section">
          <SectionHeading eyebrow="01 / PRODUCT QUALITY" title="คุณภาพสินค้าแยกตามสินค้า" description="จุดนี้จะใช้ดูว่าสินค้าแต่ละตัวมีเสียงตอบรับและปัญหาคุณภาพแบบใด" />
          {products.length ? <div className="lg-quality-product-grid">{products.map((product) => <ProductCard key={product.name} {...product} />)}</div> : <EmptyQualityState icon={<PackageSearch size={22} />} title="ยังไม่มีการจับคู่สินค้า" description="Template พร้อมรับ product_category และ product_name จาก Product Catalog หรือ JEV ในขั้นถัดไป" />}
        </section>

        <section className="lg-quality-section">
          <SectionHeading eyebrow="02 / QUALITY TOPICS" title="ประเด็นคุณภาพที่ถูกพูดถึง" description="แยกคำถามเรื่องสินค้าออกจาก sentiment เพื่อไม่ให้คำชมและปัญหาถูกรวมเป็นหมวดเดียว" />
          <div className="lg-quality-topic-list">{topics.length ? topics.map((topic) => <div className="lg-quality-topic" key={topic.name}><div><strong>{topic.name}</strong><span>{formatNumber(topic.count)} ข้อความ</span></div><div className="lg-quality-track"><i style={{ width: `${topic.percent}%` }} /></div><small>{topic.negative} ข้อความเชิงลบ</small></div>) : <EmptyQualityState title="ยังไม่มี quality topic" description="รอผลการจัดหมวดคุณภาพ เช่น เนื้อสัมผัส สี ความติดทน หรือการระคายเคือง" />}</div>
        </section>

        <section className="lg-quality-section">
          <SectionHeading eyebrow="03 / QUALITY TREND" title="ช่วงไหนที่เสียงเกี่ยวกับสินค้าพุ่งขึ้น" description="ใช้ดูจังหวะของบทสนทนาและแหล่งข้อมูลประกอบ ก่อนลงไปอ่านปัญหาเฉพาะสินค้า" />
          <div className="lg-quality-context-grid">
            <div className="lg-quality-trend-card">{trend.length ? trend.map((item) => <div className="lg-quality-trend-row" key={item.date}><span>{formatDate(item.date)}</span><div><i style={{ width: `${item.percent}%` }} /></div><b>{formatNumber(item.count)}</b></div>) : <EmptyQualityState title="ยังไม่มี timeline" description="เมื่อมีวันที่ของข้อความครบ ส่วนนี้จะแสดงช่วงที่บทสนทนาเพิ่มขึ้น" />}</div>
            <div className="lg-quality-platform-card"><strong>แหล่งข้อมูลในรอบนี้</strong>{platforms.map((item) => <div key={item.name}><span>{item.name}</span><b>{formatNumber(item.count)}</b></div>)}</div>
          </div>
        </section>

        <section className="lg-quality-split">
          <article className="lg-quality-panel issue">
            <SectionHeading eyebrow="04 / ISSUES" title="ประเด็นที่ควรตรวจสอบ" description="รวมข้อความที่อาจสะท้อนปัญหาสินค้าหรือประสบการณ์ใช้งาน" />
            <div className="lg-quality-list"><QualityListItem icon={<CircleAlert size={17} />} title="ปัญหาคุณภาพสินค้า" value={issues.length} detail="negative หรือ flagged records" /><QualityListItem icon={<CircleAlert size={17} />} title="ต้องตรวจสอบโดยคน" value={records.filter((item) => item.needsHumanReview).length} detail="confidence ต่ำหรือข้อความกำกวม" /></div>
          </article>
          <article className="lg-quality-panel opportunity">
            <SectionHeading eyebrow="05 / OPPORTUNITIES" title="โอกาสจากเสียงผู้บริโภค" description="รวมสิ่งที่สามารถนำไปต่อยอดด้านสินค้า คอนเทนต์ และการขาย" />
            <div className="lg-quality-list"><QualityListItem icon={<CheckCircle2 size={17} />} title="เสียงเชิงบวก" value={positive} detail="ใช้หา product proof และจุดเด่น" /><QualityListItem icon={<FileText size={17} />} title="หัวข้อที่มีหลักฐาน" value={topics.length} detail="พร้อมเปิดดูข้อความต้นทาง" /></div>
          </article>
        </section>

        <section className="lg-quality-section">
          <div className="lg-quality-evidence-heading"><SectionHeading eyebrow="06 / CONSUMER VOICE" title="ข้อความจริงจากผู้บริโภค" description="ใช้ยืนยันว่าข้อค้นพบด้านคุณภาพมาจากข้อความใด" /><Link className="lg-primary-link" href={`/reports/${report.slug}/evidence`}>เปิด Evidence Library <ArrowRight size={16} /></Link></div>
          <div className="lg-quality-quotes">{evidence.length ? evidence.map((item) => <blockquote key={item.id}><p>{item.text}</p><footer>{item.platform} · {formatDate(item.publishedAt)} · {item.sentiment || "รอจำแนก"}</footer></blockquote>) : <EmptyQualityState title="ยังไม่มีข้อความสำหรับแสดง" description="เมื่อมี evidence แล้ว ตัวอย่างข้อความจะปรากฏในส่วนนี้" />}</div>
        </section>

        <section className="lg-quality-method"><strong>โครงสร้างข้อมูลที่รองรับในอนาคต</strong><span>product_category</span><span>product_name</span><span>quality_topic</span><span>quality_issue</span><span>confidence</span><span>needs_human_review</span></section>
      </main>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="lg-quality-heading"><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>;
}

function QualityKpi({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail: string; tone?: string }) {
  return <article className={`lg-quality-kpi ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function ProductCard({ name, category, count, positive, negative }: { name: string; category: string; count: number; positive: number; negative: number }) {
  return <article className="lg-quality-product-card"><span>{category}</span><h3>{name}</h3><strong>{formatNumber(count)} ข้อความ</strong><div><i style={{ width: `${Math.max(positive / Math.max(count, 1) * 100, 4)}%` }} /><i style={{ width: `${Math.max(negative / Math.max(count, 1) * 100, 4)}%` }} /></div><small>บวก {positive} · ลบ {negative}</small></article>;
}

function QualityListItem({ icon, title, value, detail }: { icon: React.ReactNode; title: string; value: number; detail: string }) {
  return <div className="lg-quality-list-item"><span>{icon}</span><div><strong>{title}</strong><small>{detail}</small></div><b>{formatNumber(value)}</b></div>;
}

function EmptyQualityState({ icon, title, description }: { icon?: React.ReactNode; title: string; description: string }) {
  return <div className="lg-quality-empty">{icon ? <span>{icon}</span> : null}<strong>{title}</strong><p>{description}</p></div>;
}

function getProducts(records: QualityEvidence[]) {
  const map = new Map<string, { name: string; category: string; count: number; positive: number; negative: number }>();
  for (const item of records) {
    if (!item.productName && !item.productCategory) continue;
    const name = item.productName || "ไม่ระบุรุ่น";
    const current = map.get(name) || { name, category: item.productCategory || "สินค้า", count: 0, positive: 0, negative: 0 };
    current.count += 1;
    if (item.sentiment === "positive") current.positive += 1;
    if (item.sentiment === "negative") current.negative += 1;
    map.set(name, current);
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 6);
}

function getQualityTopics(records: QualityEvidence[]) {
  const map = new Map<string, { count: number; negative: number }>();
  for (const item of records) {
    const values = item.qualityTopics?.length ? item.qualityTopics : item.topics.filter((topic) => !/audience|conversation|official|reaction/i.test(topic));
    for (const value of Array.from(new Set(values))) {
      const name = qualityTopicLabels[value] || value;
      const current = map.get(name) || { count: 0, negative: 0 };
      current.count += 1;
      if (item.sentiment === "negative") current.negative += 1;
      map.set(name, current);
    }
  }
  const rows = Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 8);
  const max = rows[0]?.[1].count || 1;
  return rows.map(([name, value]) => ({ name, ...value, percent: Math.round((value.count / max) * 100) }));
}

function getDailyTrend(records: QualityEvidence[]) {
  const counts = new Map<string, number>();
  for (const item of records) {
    if (!item.publishedAt || Number.isNaN(Date.parse(item.publishedAt))) continue;
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(item.publishedAt));
    counts.set(date, (counts.get(date) || 0) + 1);
  }
  const rows = Array.from(counts.entries()).sort(([left], [right]) => left.localeCompare(right)).slice(-7);
  const max = Math.max(...rows.map(([, count]) => count), 1);
  return rows.map(([date, count]) => ({ date, count, percent: Math.round((count / max) * 100) }));
}

function getPlatformContext(records: QualityEvidence[]) {
  const counts = new Map<string, number>();
  for (const item of records) counts.set(item.platform, (counts.get(item.platform) || 0) + 1);
  return Array.from(counts.entries()).sort(([, left], [, right]) => right - left).map(([name, count]) => ({ name, count }));
}
function formatNumber(value: number) { return value.toLocaleString("th-TH"); }
function formatDate(value: string) { return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" }).format(new Date(value)); }
function formatDateRange(report: Report) { return `${formatDate(report.period.from)} – ${formatDate(report.period.to)}`; }