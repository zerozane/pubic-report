"use client";

import { Download, Printer } from "lucide-react";
import type { Report } from "@/lib/types";
import { getSentimentLabel } from "@/lib/format";

export default function ReportActions({ report }: { report: Report }) {
  function downloadCsv() {
    const rows = [
      ["id", "platform", "sentiment", "text", "publishedAt", "topics", "sourceUrl"],
      ...report.evidence.map((item) => [
        item.id,
        item.platform,
        getSentimentLabel(item.sentiment),
        item.text,
        item.publishedAt,
        item.topics.join("|"),
        item.sourceUrl ?? ""
      ])
    ];
    const csv =
      "\uFEFF" +
      rows
        .map((row) => row.map((value) => {
          const text = String(value);
          const safe = /^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text;
          return `"${safe.replaceAll('"', '""')}"`;
        }).join(","))
        .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.slug}-evidence.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="actions">
      <button className="btn" type="button" onClick={downloadCsv}>
        <Download size={14} aria-hidden="true" />
        CSV ทั้งรายงาน
      </button>
      <button className="btn primary" type="button" onClick={() => window.print()}>
        <Printer size={14} aria-hidden="true" />
        พิมพ์ / PDF
      </button>
    </div>
  );
}
