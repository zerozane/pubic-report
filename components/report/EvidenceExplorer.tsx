"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { ReportEvidence } from "@/lib/types";
import EvidenceCard from "./EvidenceCard";

const PAGE_SIZE = 12;

export default function EvidenceExplorer({
  evidence,
  timezone
}: {
  evidence: ReportEvidence[];
  timezone: string;
}) {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const query = search.get("q") ?? "";
  const rawSentiment = search.get("sentiment") ?? "all";
  const sentiment = ["all", "positive", "neutral", "negative", "unclassified"].includes(rawSentiment)
    ? rawSentiment
    : "all";
  const topic = search.get("topic") ?? "all";
  const rawType = search.get("type") ?? "comment";
  const type = ["all", "post", "comment"].includes(rawType) ? rawType : "comment";
  const ids = search.get("ids");

  const topics = useMemo(
    () => Array.from(new Set(evidence.flatMap((item) => item.topics))).sort((a, b) => a.localeCompare(b, "th")),
    [evidence]
  );

  const filtered = useMemo(() => {
    const selectedIds = ids === null ? null : new Set(ids.split(","));
    const keyword = query.trim().toLocaleLowerCase("th");

    return evidence.filter(
      (item) =>
        (type === "all" || item.recordType === type) &&
        (sentiment === "all" ||
          (sentiment === "unclassified" ? item.sentiment === null : item.sentiment === sentiment)) &&
        (topic === "all" || item.topics.includes(topic)) &&
        (!selectedIds || selectedIds.has(item.id)) &&
        [item.text, ...item.topics].join(" ").toLocaleLowerCase("th").includes(keyword)
    );
  }, [evidence, query, sentiment, topic, type, ids]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const requestedPage = Number(search.get("page") ?? 1);
  const page = Number.isSafeInteger(requestedPage) ? Math.max(1, Math.min(pages, requestedPage)) : 1;

  function update(key: string, value: string) {
    const params = new URLSearchParams(search.toString());
    if (!value || (value === "all" && key !== "type")) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    if (key !== "page") params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      <form
        className="evidence-search"
        key={query}
        onSubmit={(event) => {
          event.preventDefault();
          update("q", String(new FormData(event.currentTarget).get("q") ?? ""));
        }}
      >
        <label className="search-label" htmlFor="evidence-search">
          ค้นหาในหลักฐาน
        </label>
        <div className="search-line">
          <input
            id="evidence-search"
            className="search"
            name="q"
            type="search"
            placeholder="ค้นหาข้อความหรือประเด็น..."
            defaultValue={query}
          />
          <button className="btn primary" type="submit">
            ค้นหา
          </button>
        </div>
      </form>

      <div className="evidence-controls">
        <label>
          ประเภทข้อมูล
          <select className="select" value={type} onChange={(event) => update("type", event.target.value)}>
            <option value="comment">ความคิดเห็น</option>
            <option value="post">โพสต์ต้นทาง</option>
            <option value="all">ทั้งหมด</option>
          </select>
        </label>

        <label>
          ความรู้สึก
          <select className="select" value={sentiment} onChange={(event) => update("sentiment", event.target.value)}>
            <option value="all">ทุกความรู้สึก</option>
            <option value="unclassified">ยังไม่จัดประเภท</option>
            <option value="positive">เชิงบวก</option>
            <option value="neutral">เป็นกลาง</option>
            <option value="negative">เชิงลบ</option>
          </select>
        </label>

        <label>
          ประเด็น
          <select className="select" value={topic} onChange={(event) => update("topic", event.target.value)}>
            <option value="all">ทุกประเด็น</option>
            {topics.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
            {topic !== "all" && !topics.includes(topic) ? <option value={topic}>{topic}</option> : null}
          </select>
        </label>

        <button className="btn" type="button" onClick={() => router.replace(pathname, { scroll: false })}>
          ล้างตัวกรอง
        </button>
      </div>

      {ids !== null ? (
        <div className="demo">
          กำลังแสดงหลักฐานที่อ้างอิงในข้อค้นพบ{" "}
          <button className="inline-button" type="button" onClick={() => update("ids", "")}>
            แสดงหลักฐานอื่นด้วย
          </button>
        </div>
      ) : null}

      <p className="results-count" role="status" aria-live="polite">
        พบ {filtered.length.toLocaleString("th-TH")} รายการ
        {filtered.length > 0
          ? ` · แสดง ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, filtered.length)}`
          : ""}
        <span>แชร์ URL นี้เพื่อเปิดตัวกรองเดียวกัน</span>
      </p>

      <div className="evidence-grid">
        {filtered.length ? (
          filtered
            .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
            .map((item) => <EvidenceCard key={item.id} item={item} timezone={timezone} />)
        ) : (
          <div className="card empty">
            <strong>{evidence.length ? "ไม่พบหลักฐานที่ตรงกับตัวกรอง" : "ยังไม่มีหลักฐานในรายงานนี้"}</strong>
            <p>{evidence.length ? "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง" : "รอนำเข้าข้อมูลที่ผ่านการตรวจทาน"}</p>
          </div>
        )}
      </div>

      {pages > 1 ? (
        <nav className="pagination" aria-label="หน้าหลักฐาน">
          <button className="btn" disabled={page === 1} onClick={() => update("page", String(page - 1))}>
            ← ก่อนหน้า
          </button>
          <span>
            หน้า {page} / {pages}
          </span>
          <button className="btn" disabled={page === pages} onClick={() => update("page", String(page + 1))}>
            ถัดไป →
          </button>
        </nav>
      ) : null}
    </>
  );
}
