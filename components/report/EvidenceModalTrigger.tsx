"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import type { ReportEvidence } from "@/lib/types";

const PAGE_SIZE = 10;

const sentimentLabels: Record<string, string> = {
  positive: "เชิงบวก",
  neutral: "เป็นกลาง",
  negative: "เชิงลบ"
};

export default function EvidenceModalTrigger({
  title,
  records,
  allEvidence
}: {
  title: string;
  records: ReportEvidence[];
  allEvidence: ReportEvidence[];
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(Math.ceil(records.length / PAGE_SIZE), 1);
  const visibleRecords = useMemo(
    () => records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, records]
  );

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  function openModal() {
    setPage(1);
    setOpen(true);
  }

  return (
    <>
      <button className="lg-brief-evidence-link" onClick={openModal} type="button">
        ดูทั้งหมด {records.length.toLocaleString("th-TH")} รายการ
      </button>

      {open && typeof document !== "undefined" ? createPortal((
        <div className="lg-evidence-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <section className="lg-evidence-modal" role="dialog" aria-modal="true" aria-labelledby="evidence-modal-title">
            <header className="lg-evidence-modal-head">
              <div>
                <span>ข้อความที่ตรงกับหัวข้อนี้</span>
                <h2 id="evidence-modal-title">{title}</h2>
                <p>{records.length.toLocaleString("th-TH")} รายการ จากเสียงผู้บริโภค</p>
              </div>
              <button className="lg-evidence-modal-close" onClick={() => setOpen(false)} type="button" aria-label="ปิดรายการข้อความ">
                <X size={18} />
              </button>
            </header>

            <div className="lg-evidence-modal-list">
              {visibleRecords.map((record) => {
                const source = getSource(record, allEvidence);
                return (
                  <article className="lg-evidence-modal-item" key={record.id}>
                    <div className="lg-evidence-modal-meta">
                      <span>{record.platform}</span>
                      <span>{record.recordType === "comment" ? "ความคิดเห็น" : "โพสต์"}</span>
                      <span className={`lg-evidence-modal-sentiment ${record.sentiment || "neutral"}`}>
                        {sentimentLabels[record.sentiment || "neutral"]}
                      </span>
                      <time>{formatDate(record.publishedAt)}</time>
                    </div>
                    <p>{record.text}</p>
                    <div className="lg-evidence-modal-foot">
                      <div className="lg-keyword-list">
                        {(record.matchedKeywords || record.topics || []).slice(0, 4).map((value) => (
                          <span key={value}>{value}</span>
                        ))}
                      </div>
                      {source ? (
                        <a href={source} target="_blank" rel="noreferrer">
                          เปิดโพสต์ต้นทาง <ExternalLink size={13} />
                        </a>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 ? (
              <footer className="lg-evidence-modal-pagination">
                <span>หน้า {page} จาก {totalPages}</span>
                <div>
                  <button onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={page === 1} type="button">
                    <ChevronLeft size={15} /> ก่อนหน้า
                  </button>
                  <button onClick={() => setPage((current) => Math.min(current + 1, totalPages))} disabled={page === totalPages} type="button">
                    ถัดไป <ChevronRight size={15} />
                  </button>
                </div>
              </footer>
            ) : null}
          </section>
        </div>
      ), document.body) : null}
    </>
  );
}

function getSource(record: ReportEvidence, allEvidence: ReportEvidence[]) {
  const parent = record.parentPostId ? allEvidence.find((item) => item.id === record.parentPostId || item.sourceId === record.parentPostId) : null;
  const source = parent?.sourceUrl || record.sourceUrl;
  return source && /^https?:\/\//i.test(source) ? source : null;
}

function formatDate(value: string) {
  if (!value || Number.isNaN(Date.parse(value))) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok"
  }).format(new Date(value));
}
