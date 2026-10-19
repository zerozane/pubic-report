"use client";

import Link from "next/link";
import { useMemo, useState, type FocusEvent, type PointerEvent, type ReactNode } from "react";
import {
  EXPERIENCE_TYPES,
  QUALITY_TOPICS,
  averageRating,
  equalWeightRating,
  equalWeightShare,
  marginOfError,
  shareOf,
  type DashboardProduct,
  type QualityDashboardData,
  type ReviewType,
  type Segment,
} from "@/lib/qualityDashboard";

// Upper bounds (in %) of the heatmap bins; picked from the data's quintiles so every step is used.
const HEAT_BINS = [2, 8, 15, 30];

const TOPIC_SHORT: Record<string, string> = {
  "สีและเฉดสี": "สี/เฉดสี",
  "เนื้อสัมผัสและการเกลี่ย": "เนื้อสัมผัส",
  "ติดทนและกันน้ำ": "ติดทน",
  "ผลลัพธ์การใช้งาน": "ผลลัพธ์",
  "การระคายเคืองและผิวแพ้ง่าย": "ผิวแพ้",
  "กลิ่น": "กลิ่น",
  "แพ็กเกจและการใช้งาน": "แพ็กเกจ",
  "ราคาและความคุ้มค่า": "ราคา",
  "การจัดส่งและร้านค้า": "จัดส่ง/ร้าน",
};

const REVIEW_TYPES: Array<{ value: ReviewType; label: string }> = [
  { value: "all", label: "ทุกรีวิว" },
  { value: "organic", label: "รีวิวทั่วไป" },
  { value: "incentivized", label: "ได้สิ่งตอบแทน" },
];

type SortKey = "not-positive" | "negative" | "rating";

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: "not-positive", label: "เชิงกลาง + เชิงลบ มากสุด" },
  { value: "negative", label: "เชิงลบ มากสุด" },
  { value: "rating", label: "คะแนนเฉลี่ย ต่ำสุด" },
];

type Mix = { positive: number | null; neutral: number | null; negative: number | null; reviews: number };
type Tip = { x: number; y: number; value: string; label: string; detail?: string } | null;
type TipHandlers = (value: string, label: string, detail?: string) => object;

function segmentMix(segment: Segment): Mix {
  return {
    positive: shareOf(segment.positive, segment.reviews),
    neutral: shareOf(segment.neutral, segment.reviews),
    negative: shareOf(segment.negative, segment.reviews),
    reviews: segment.reviews,
  };
}

// Groups (all products, a category) average their products' shares so a 1,000-review sample
// does not outweigh a 500-review one.
function groupMix(segments: Segment[]): Mix {
  const base = (segment: Segment) => segment.reviews;
  return {
    positive: equalWeightShare(segments, (segment) => segment.positive, base),
    neutral: equalWeightShare(segments, (segment) => segment.neutral, base),
    negative: equalWeightShare(segments, (segment) => segment.negative, base),
    reviews: segments.reduce((sum, segment) => sum + segment.reviews, 0),
  };
}

const notPositive = (mix: Mix) => (mix.neutral === null || mix.negative === null ? null : mix.neutral + mix.negative);

export default function QualityDashboard({ data, slug }: { data: QualityDashboardData; slug: string }) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [reviewType, setReviewType] = useState<ReviewType>("all");
  const [sort, setSort] = useState<SortKey>("not-positive");
  const [tip, setTip] = useState<Tip>(null);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    data.products.forEach((product) => counts.set(product.category, (counts.get(product.category) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0], "th"));
  }, [data.products]);

  const toggleCategory = (name: string) =>
    setSelectedCategories((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));

  const products = useMemo(
    () => (selectedCategories.length ? data.products.filter((product) => selectedCategories.includes(product.category)) : data.products),
    [selectedCategories, data.products]
  );

  const segments = useMemo(() => products.map((product) => product.segments[reviewType]), [products, reviewType]);
  const overall = useMemo(() => groupMix(segments), [segments]);

  const productRows = useMemo(() => {
    const rows = products.map((product) => {
      const segment = product.segments[reviewType];
      return { product, segment, mix: segmentMix(segment), rating: averageRating(segment) };
    });
    const value = (row: (typeof rows)[number]) =>
      sort === "negative" ? row.mix.negative ?? -1 : sort === "rating" ? -(row.rating ?? 6) : notPositive(row.mix) ?? -1;
    return rows.sort((a, b) => value(b) - value(a));
  }, [products, reviewType, sort]);

  // The category chart always lists every category; selected ones are emphasized, not removed.
  const categoryRows = useMemo(
    () =>
      categories
        .map(([name, count]) => {
          const members = data.products.filter((product) => product.category === name).map((product) => product.segments[reviewType]);
          return { name, count, mix: groupMix(members) };
        })
        .sort((a, b) => (notPositive(b.mix) ?? -1) - (notPositive(a.mix) ?? -1)),
    [categories, data.products, reviewType]
  );

  const incentiveRows = useMemo(
    () =>
      products
        .map((product) => ({ product, share: shareOf(product.segments.incentivized.reviews, product.segments.all.reviews) }))
        .sort((a, b) => (b.share ?? -1) - (a.share ?? -1)),
    [products]
  );
  const incentiveAverage = average(incentiveRows.map((row) => row.share));
  const organicGap = notPositive(groupMix(products.map((product) => product.segments.organic)));
  const incentivizedGap = notPositive(groupMix(products.map((product) => product.segments.incentivized)));

  const experience = EXPERIENCE_TYPES.map((type) => ({
    type,
    share: equalWeightShare(segments, (segment) => segment.experience[type] || 0, (segment) => segment.reviews),
    count: segments.reduce((sum, segment) => sum + (segment.experience[type] || 0), 0),
  }));

  const sentimentScale = niceCeil(
    Math.max(...productRows.map((row) => notPositive(row.mix) ?? 0), ...categoryRows.map((row) => notPositive(row.mix) ?? 0), 1)
  );
  const qualityHref = (params: Record<string, string>) => `/reports/${slug}/quality?${new URLSearchParams(params).toString()}#quality-explorer`;
  const reviewTypeLabel = REVIEW_TYPES.find((item) => item.value === reviewType)?.label ?? "";

  const tipHandlers: TipHandlers = (value, label, detail) => ({
    onPointerMove: (event: PointerEvent<HTMLElement>) => setTip({ x: event.clientX, y: event.clientY, value, label, detail }),
    onPointerLeave: () => setTip(null),
    onFocus: (event: FocusEvent<HTMLElement>) => {
      const box = event.currentTarget.getBoundingClientRect();
      setTip({ x: box.left + box.width / 2, y: box.top, value, label, detail });
    },
    onBlur: () => setTip(null),
  });

  if (!data.products.length) {
    return (
      <main className="lg-container lg-main lg-dash">
        <div className="lg-dash-empty">
          <strong>ยังไม่มีรีวิวสินค้าสำหรับรายงานนี้</strong>
          <p>รัน <code>npm run quality:refresh</code> เพื่อสร้างไฟล์รีวิว แล้วเปิดหน้านี้อีกครั้ง</p>
        </div>
      </main>
    );
  }

  return (
    <main className="lg-container lg-main lg-dash">
      <header className="lg-dash-head">
        <div>
          <h1>Dashboard คุณภาพสินค้า</h1>
          <p>เทียบทุกสินค้าในหน้าเดียวจากรีวิวผู้ซื้อ คลิกแถวหรือช่องใดก็ได้เพื่ออ่านรีวิวต้นทางในหน้าคุณภาพสินค้า</p>
        </div>
        <p className="lg-dash-scope">
          {data.source.platform} {data.source.region}
          {data.source.collectedAt ? ` · เก็บข้อมูล ${formatDate(data.source.collectedAt)}` : ""}
        </p>
      </header>

      <div className="lg-dash-filter" aria-label="ตัวกรอง">
        <div className="lg-dash-filter-group" role="group" aria-label="หมวดสินค้า">
          <span>หมวดสินค้า</span>
          <div className="lg-dash-chips">
            <button type="button" className={selectedCategories.length ? "" : "is-active"} aria-pressed={!selectedCategories.length} onClick={() => setSelectedCategories([])}>
              ทุกหมวด <small>{data.products.length}</small>
            </button>
            {categories.map(([name, count]) => {
              const active = selectedCategories.includes(name);
              return (
                <button type="button" key={name} className={active ? "is-active" : ""} aria-pressed={active} onClick={() => toggleCategory(name)}>
                  {name} <small>{count}</small>
                </button>
              );
            })}
          </div>
        </div>
        <div className="lg-dash-filter-group" role="group" aria-label="ประเภทรีวิว">
          <span>ประเภทรีวิว</span>
          <div className="lg-dash-segmented">
            {REVIEW_TYPES.map((item) => (
              <button type="button" key={item.value} className={reviewType === item.value ? "is-active" : ""} aria-pressed={reviewType === item.value} onClick={() => setReviewType(item.value)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <p className="lg-dash-filter-summary">
          แสดง <strong>{products.length}</strong> สินค้า · <strong>{formatNumber(overall.reviews)}</strong> รีวิว ({reviewTypeLabel}) · เลือกได้หลายหมวด
        </p>
      </div>

      <section className="lg-dash-kpis" aria-label="ตัวเลขสรุป">
        <Stat label="รีวิวที่วิเคราะห์" value={formatNumber(overall.reviews)} note={`จาก ${products.length} สินค้า · สินค้าละ 500–1,000 รีวิว`} />
        <Stat label="คะแนนเฉลี่ย" value={formatRating(equalWeightRating(segments))} note="เฉลี่ยของทุกสินค้า สินค้าละ 1 เสียงเท่ากัน" />
        <article className="lg-dash-stat lg-dash-stat-mix">
          <span>ความรู้สึกจากคะแนนดาว</span>
          <SentimentStack mix={overall} />
          <dl>
            <div><dt><i className="pos" />เชิงบวก</dt><dd>{formatMaybe(overall.positive)}</dd></div>
            <div><dt><i className="neu" />เชิงกลาง</dt><dd>{formatMaybe(overall.neutral)}</dd></div>
            <div><dt><i className="neg" />เชิงลบ</dt><dd>{formatMaybe(overall.negative)}</dd></div>
          </dl>
        </article>
        <Stat label="รีวิวที่ได้สิ่งตอบแทน" value={formatMaybe(incentiveAverage)} note="เฉลี่ยต่อสินค้า · ตัดออกได้ที่ “ประเภทรีวิว”" />
      </section>

      <section className="lg-dash-card" aria-labelledby="dash-ranking-title">
        <div className="lg-dash-chart-head has-control">
          <div>
            <h2 id="dash-ranking-title">ความรู้สึกรายสินค้า</h2>
            <p>แท่งขยายเฉพาะส่วนเชิงกลางและเชิงลบ เพราะเชิงบวกสูงกว่า 90% ทุกสินค้า ตัวเลขด้านขวาครบทั้ง 3 กลุ่ม</p>
          </div>
          <label className="lg-dash-sort">
            <span>เรียงตาม</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
              {SORTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </div>
        <SentimentLegend />
        <MixHeader first="สินค้า" />
        <div className="lg-dash-mix-rows">
          {productRows.map(({ product, segment, mix, rating }) => (
            <MixRow
              key={product.id}
              href={qualityHref({ product: product.key })}
              label={product.label}
              sub={`${product.category} · ${formatNumber(segment.reviews)} รีวิว`}
              mix={mix}
              scale={sentimentScale}
              emphasis
              tip={tipHandlers(
                formatMaybe(notPositive(mix)),
                `${product.label} · เชิงกลาง + เชิงลบ`,
                `${formatNumber(segment.neutral + segment.negative)} จาก ${formatNumber(segment.reviews)} รีวิว · คลาดเคลื่อน ±${formatPercent(marginOfError(notPositive(mix) ?? 0, segment.reviews))} · เฉลี่ย ${formatRating(rating)}`
              )}
            />
          ))}
        </div>
        <MixAxis max={sentimentScale} />
        <TableView caption="ความรู้สึกรายสินค้า" head={["สินค้า", "หมวด", "รีวิว", "เชิงบวก", "เชิงกลาง", "เชิงลบ", "คลาดเคลื่อน ±", "คะแนนเฉลี่ย"]}>
          {productRows.map(({ product, segment, mix, rating }) => (
            <tr key={product.id}>
              <td>{product.label}</td>
              <td>{product.category}</td>
              <td>{formatNumber(segment.reviews)}</td>
              <td>{formatMaybe(mix.positive)}</td>
              <td>{formatMaybe(mix.neutral)}</td>
              <td>{formatMaybe(mix.negative)}</td>
              <td>{notPositive(mix) === null ? "—" : formatPercent(marginOfError(notPositive(mix) ?? 0, segment.reviews))}</td>
              <td>{formatRating(rating)}</td>
            </tr>
          ))}
        </TableView>
      </section>

      <section className="lg-dash-card" aria-labelledby="dash-category-title">
        <div className="lg-dash-chart-head">
          <h2 id="dash-category-title">เทียบตามหมวดสินค้า</h2>
          <p>ค่าเฉลี่ยของสินค้าในหมวด (สินค้าละ 1 เสียงเท่ากัน) ใช้เกณฑ์ความรู้สึกเดียวกับด้านบน · คลิกเพื่อเลือกหรือยกเลิกหมวด</p>
        </div>
        <MixHeader first="หมวด" />
        <div className="lg-dash-mix-rows">
          {categoryRows.map((row) => (
            <MixRow
              key={row.name}
              onClick={() => toggleCategory(row.name)}
              pressed={selectedCategories.includes(row.name)}
              label={row.name}
              sub={`${row.count} สินค้า · ${formatNumber(row.mix.reviews)} รีวิว`}
              mix={row.mix}
              scale={sentimentScale}
              emphasis={!selectedCategories.length || selectedCategories.includes(row.name)}
              tip={tipHandlers(formatMaybe(notPositive(row.mix)), `${row.name} · เชิงกลาง + เชิงลบ`, `${row.count} สินค้า · ${formatNumber(row.mix.reviews)} รีวิว`)}
            />
          ))}
        </div>
        <MixAxis max={sentimentScale} />
        {categoryRows.some((row) => row.count === 1) ? (
          <p className="lg-dash-footnote">หมวดที่มีสินค้าเดียว ค่าของหมวดคือค่าของสินค้านั้น</p>
        ) : null}
      </section>

      <section className="lg-dash-card" aria-labelledby="dash-incentive-title">
        <div className="lg-dash-chart-head">
          <h2 id="dash-incentive-title">รีวิวที่ได้สิ่งตอบแทน ทำให้คะแนนสูงขึ้นแค่ไหน</h2>
          <p>TikTok Shop ติดป้ายรีวิวที่ผู้เขียนได้รับสิ่งตอบแทน เช่น คูปองหรือของแถม แท่งด้านล่างคือสัดส่วนรีวิวกลุ่มนี้ในแต่ละสินค้า</p>
        </div>
        <div className="lg-dash-compare">
          <div>
            <span>รีวิวทั่วไป เป็นเชิงกลาง/ลบ</span>
            <strong>{formatMaybe(organicGap)}</strong>
          </div>
          <div>
            <span>รีวิวที่ได้สิ่งตอบแทน เป็นเชิงกลาง/ลบ</span>
            <strong>{formatMaybe(incentivizedGap)}</strong>
          </div>
          <p>
            {organicGap !== null && incentivizedGap !== null && organicGap > incentivizedGap
              ? `รีวิวทั่วไปให้เชิงกลาง/ลบมากกว่า ${(organicGap - incentivizedGap).toFixed(1)} จุด สินค้าที่มีรีวิวได้สิ่งตอบแทนสัดส่วนสูง (แท่งยาว) จึงอาจดูดีกว่าความจริง เลือก “รีวิวทั่วไป” ที่ตัวกรองด้านบนเพื่อเทียบแบบตัดผลนี้ออก`
              : "รีวิวสองกลุ่มให้ผลใกล้เคียงกัน สิ่งตอบแทนไม่ได้ทำให้คะแนนต่างกันชัดเจนในสินค้าที่เลือก"}
          </p>
        </div>
        <div className="lg-dash-bars">
          {incentiveRows.map(({ product, share }) => (
            <div
              key={product.id}
              tabIndex={0}
              className="lg-dash-bar is-emphasis"
              {...tipHandlers(formatMaybe(share), product.label, `${formatNumber(product.segments.incentivized.reviews)} จาก ${formatNumber(product.segments.all.reviews)} รีวิว`)}
            >
              <span className="lg-dash-bar-label"><strong>{product.label}</strong><small>{product.category}</small></span>
              <span className="lg-dash-bar-track"><i style={{ width: `${share ?? 0}%` }} /></span>
              <span className="lg-dash-bar-value">{formatMaybe(share, 0)}</span>
            </div>
          ))}
        </div>
        <Axis max={100} />
      </section>

      <section className="lg-dash-card" aria-labelledby="dash-heatmap-title">
        <div className="lg-dash-chart-head">
          <h2 id="dash-heatmap-title">ลูกค้าพูดถึงเรื่องอะไรในแต่ละสินค้า</h2>
          <p>% ของรีวิวสินค้านั้นที่พูดถึงหัวข้อ (ทั้งชมและติ ยังไม่ใช่สัญญาณปัญหา) · เทียบข้ามสินค้าได้เพราะคิดเป็น % ของรีวิวสินค้าตัวเอง · คลิกช่องเพื่ออ่านรีวิว</p>
        </div>
        <HeatLegend />
        <div className="lg-dash-heat-scroll">
          <table className="lg-dash-heat">
            <caption className="lg-dash-sr">สัดส่วนรีวิวที่พูดถึงแต่ละหัวข้อ แยกตามสินค้า</caption>
            <thead>
              <tr>
                <th scope="col">สินค้า</th>
                {QUALITY_TOPICS.map((topic) => <th scope="col" key={topic} title={topic}>{TOPIC_SHORT[topic]}</th>)}
              </tr>
            </thead>
            <tbody>
              {productRows.map(({ product, segment }) => (
                <tr key={product.id}>
                  <th scope="row">{product.label}</th>
                  {QUALITY_TOPICS.map((topic) => (
                    <HeatCell key={topic} product={product} segment={segment} topic={topic} href={qualityHref({ product: product.key, topic })} tipHandlers={tipHandlers} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="lg-dash-card" aria-labelledby="dash-experience-title">
        <div className="lg-dash-chart-head">
          <h2 id="dash-experience-title">รีวิวพูดเรื่องอะไรเป็นหลัก</h2>
          <p>แยกรีวิวที่เล่าการใช้สินค้า ออกจากรีวิวที่พูดแค่เรื่องร้านหรือการจัดส่ง · เฉลี่ยต่อสินค้า</p>
        </div>
        <div className="lg-dash-bars is-compact">
          {experience.map((row) => (
            <div key={row.type} tabIndex={0} className="lg-dash-bar is-emphasis" {...tipHandlers(formatMaybe(row.share), row.type, `${formatNumber(row.count)} รีวิว`)}>
              <span className="lg-dash-bar-label"><strong>{row.type}</strong></span>
              <span className="lg-dash-bar-track"><i style={{ width: `${row.share ?? 0}%` }} /></span>
              <span className="lg-dash-bar-value">{formatMaybe(row.share)}</span>
            </div>
          ))}
        </div>
        <Axis max={100} />
      </section>

      <aside className="lg-dash-notes" aria-label="วิธีคำนวณ">
        <h2>เทียบตัวเลขข้ามสินค้าอย่างไรให้ยุติธรรม</h2>
        <ul>
          <li><strong>เกณฑ์ความรู้สึก:</strong> 5 ดาว = เชิงบวก · 3–4 ดาว = เชิงกลาง · 1–2 ดาว = เชิงลบ ใช้เกณฑ์เดียวกับหน้าคุณภาพสินค้า</li>
          <li><strong>ขนาดตัวอย่างไม่เท่ากัน:</strong> 6 สินค้ามี 1,000 รีวิว อีก 6 สินค้ามี 500 รีวิว ตัวเลขรายสินค้าคิดเป็น % ของรีวิวสินค้าตัวเอง จึงเทียบกันได้ ส่วนค่ารวมและค่าหมวดใช้ค่าเฉลี่ยของสินค้า (สินค้าละ 1 เสียงเท่ากัน) ไม่ให้สินค้าที่มี 1,000 รีวิวมีน้ำหนักเป็น 2 เท่า</li>
          <li><strong>ค่าคลาดเคลื่อน:</strong> สินค้าที่มี 500 รีวิวคลาดเคลื่อนได้มากกว่าสินค้าที่มี 1,000 รีวิว (ประมาณ ±1–2 จุด เทียบ ±0.5–1.5 จุด) ความต่างที่น้อยกว่านี้ไม่ควรถือว่าต่างจริง ดูค่ารายสินค้าได้ใน “ดูเป็นตาราง”</li>
          <li><strong>เป็นรีวิวล่าสุดของแต่ละสินค้า:</strong> จึงไม่แสดงแนวโน้มตามเวลาหรือจำนวนรีวิวต่อสินค้า เพราะสะท้อนวิธีเก็บข้อมูล ไม่ใช่ยอดขาย</li>
          <li>กลุ่มที่มีน้อยกว่า 30 รีวิวแสดงเป็น “—” ไม่แสดงเป็นเปอร์เซ็นต์</li>
        </ul>
      </aside>

      {tip ? (
        <div className="lg-dash-tip" role="status" style={{ left: tip.x, top: tip.y }}>
          <strong>{tip.value}</strong>
          <span>{tip.label}</span>
          {tip.detail ? <small>{tip.detail}</small> : null}
        </div>
      ) : null}
    </main>
  );
}

function MixHeader({ first }: { first: string }) {
  return (
    <div className="lg-dash-mix-head" aria-hidden="true">
      <span>{first}</span>
      <span>เชิงกลาง + เชิงลบ</span>
      <span>บวก</span>
      <span>กลาง</span>
      <span>ลบ</span>
    </div>
  );
}

function MixRow({
  label,
  sub,
  mix,
  scale,
  emphasis,
  href,
  onClick,
  pressed,
  tip,
}: {
  label: string;
  sub: string;
  mix: Mix;
  scale: number;
  emphasis: boolean;
  href?: string;
  onClick?: () => void;
  pressed?: boolean;
  tip: object;
}) {
  const content = (
    <>
      <span className="lg-dash-bar-label"><strong>{label}</strong><small>{sub}</small></span>
      <span className="lg-dash-mix-track">
        <i className="neu" style={{ width: `${((mix.neutral ?? 0) / scale) * 100}%` }} />
        <i className="neg" style={{ width: `${((mix.negative ?? 0) / scale) * 100}%` }} />
      </span>
      <span className="lg-dash-mix-num">{formatMaybe(mix.positive)}</span>
      <span className="lg-dash-mix-num">{formatMaybe(mix.neutral)}</span>
      <span className="lg-dash-mix-num">{formatMaybe(mix.negative)}</span>
    </>
  );
  const className = `lg-dash-mix-row${emphasis ? "" : " is-quiet"}`;
  if (href) return <Link href={href} className={className} {...tip}>{content}</Link>;
  return <button type="button" className={className} onClick={onClick} aria-pressed={pressed} {...tip}>{content}</button>;
}

function MixAxis({ max }: { max: number }) {
  return (
    <div className="lg-dash-axis is-mix" aria-hidden="true">
      {[0, max / 2, max].map((tick) => <span key={tick}>{formatPercent(tick, tick % 1 ? 1 : 0)}</span>)}
    </div>
  );
}

function SentimentStack({ mix }: { mix: Mix }) {
  return (
    <span className="lg-dash-stack" aria-hidden="true">
      <i className="pos" style={{ width: `${mix.positive ?? 0}%` }} />
      <i className="neu" style={{ width: `${mix.neutral ?? 0}%` }} />
      <i className="neg" style={{ width: `${mix.negative ?? 0}%` }} />
    </span>
  );
}

function SentimentLegend() {
  return (
    <div className="lg-dash-legend">
      <span><i className="pos" />เชิงบวก = 5 ดาว</span>
      <span><i className="neu" />เชิงกลาง = 3–4 ดาว</span>
      <span><i className="neg" />เชิงลบ = 1–2 ดาว</span>
    </div>
  );
}

function HeatCell({
  product,
  segment,
  topic,
  href,
  tipHandlers,
}: {
  product: DashboardProduct;
  segment: Segment;
  topic: string;
  href: string;
  tipHandlers: TipHandlers;
}) {
  const count = segment.topics[topic] || 0;
  const share = shareOf(count, segment.reviews);
  const bin = share === null ? -1 : HEAT_BINS.findIndex((limit) => share < limit);
  const level = count === 0 || share === null ? "none" : bin === -1 ? HEAT_BINS.length : bin;
  const value = share === null ? `${count}` : `${Math.round(share)}%`;
  return (
    <td>
      <Link
        href={href}
        className={`lg-dash-heat-cell level-${level}`}
        aria-label={`${product.label} · ${topic}: ${value} (${count} รีวิว)`}
        {...tipHandlers(share === null ? `${count} รีวิว` : formatPercent(share), `${product.label} · ${topic}`, `${formatNumber(count)} จาก ${formatNumber(segment.reviews)} รีวิว`)}
      >
        {count === 0 ? "–" : value}
      </Link>
    </td>
  );
}

function HeatLegend() {
  const labels = ["< 2%", "2–8%", "8–15%", "15–30%", "≥ 30%"];
  return (
    <div className="lg-dash-heat-legend" aria-hidden="true">
      <span>พูดถึงน้อย</span>
      {labels.map((label, index) => (
        <span key={label} className="lg-dash-heat-key"><i className={`level-${index}`} />{label}</span>
      ))}
      <span>พูดถึงมาก</span>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="lg-dash-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function Axis({ max }: { max: number }) {
  return (
    <div className="lg-dash-axis" aria-hidden="true">
      {[0, max / 2, max].map((tick) => <span key={tick}>{formatPercent(tick, tick % 1 ? 1 : 0)}</span>)}
    </div>
  );
}

function TableView({ caption, head, children }: { caption: string; head: string[]; children: ReactNode }) {
  return (
    <details className="lg-dash-table">
      <summary>ดูเป็นตาราง</summary>
      <div className="lg-dash-table-scroll">
        <table>
          <caption className="lg-dash-sr">{caption}</caption>
          <thead><tr>{head.map((cell) => <th scope="col" key={cell}>{cell}</th>)}</tr></thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </details>
  );
}

function average(values: Array<number | null>) {
  const present = values.filter((value): value is number => value !== null);
  return present.length ? present.reduce((sum, value) => sum + value, 0) / present.length : null;
}

function niceCeil(value: number) {
  if (value <= 1) return 1;
  if (value <= 2) return 2;
  if (value <= 5) return 5;
  if (value <= 10) return 10;
  return Math.ceil(value / 10) * 10;
}

function formatMaybe(value: number | null, digits = 1) {
  return value === null ? "—" : formatPercent(value, digits);
}

function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

function formatRating(value: number | null) {
  return value === null ? "—" : `${value.toFixed(2)} / 5`;
}

function formatNumber(value: number) {
  return value.toLocaleString("th-TH");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}
