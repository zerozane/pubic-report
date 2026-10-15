"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clipboard, Database, FileJson, Play, Save, Search } from "lucide-react";

const storageKey = "laglace-backoffice-draft-v1";

const defaultDraft = {
  campaignName: "LA GLACE",
  reportSlug: "laglace-clean-social-report",
  dateFrom: "2026-09-01",
  dateTo: "2026-09-30",
  platforms: ["TikTok", "Facebook", "Instagram", "X"],
  keywords: "\"La Glace\" OR laglace\n\"ลากาส\" OR \"ลากลาซ\" OR \"ลิปไอติม\" OR \"บลัชดำ\"",
  note: ""
};

type Draft = typeof defaultDraft;

export default function BackofficeWorkbench() {
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      setDraft({ ...defaultDraft, ...JSON.parse(saved) });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  const keywordLines = useMemo(() => draft.keywords.split(/\r?\n/).filter((line) => line !== ""), [draft.keywords]);
  const xSearchInput = useMemo(() => ({
    searchTerms: keywordLines,
    since: draft.dateFrom,
    until: addOneDay(draft.dateTo),
    language: "th",
    maxTweets: 25,
    maxTweetsPerTerm: 10,
    maxPagesPerTerm: 3,
    onlyWithMedia: false,
    includeReplies: true,
    includeRetweets: false
  }), [draft.dateFrom, draft.dateTo, keywordLines]);

  const runConfig = useMemo(() => ({
    runId: `${draft.reportSlug}-${draft.dateFrom}-${draft.dateTo}`.replace(/[^a-zA-Z0-9_-]/g, "-"),
    campaignName: draft.campaignName,
    reportSlug: draft.reportSlug,
    dateRange: {
      from: draft.dateFrom,
      to: draft.dateTo,
      timezone: "Asia/Bangkok"
    },
    platforms: draft.platforms,
    rawKeywords: keywordLines,
    keywordPolicy: "ใช้คำที่ผู้ใช้กรอกแบบเดิม ไม่แก้ ไม่แปล ไม่รวมคำ ไม่ตัดแฮชแท็ก",
    storageModel: {
      collectionRuns: "บันทึก config และผลการรัน",
      rawRecords: "เก็บ JSON ดิบจาก provider",
      normalizedRecords: "ข้อมูลที่ map แล้วสำหรับกราฟและหลักฐาน"
    },
    jev: {
      status: "รอออกแบบกฎกรองร่วมกัน",
      note: draft.note
    }
  }), [draft, keywordLines]);

  const commands = [
    "npm run apify:x:search -- --input work/inputs/apify-x-search.json",
    "npm run apify:x:collect -- --input work/inputs/apify-x-replies-from-search.json",
    "npm run validate:data"
  ].join("\n");

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function togglePlatform(value: string) {
    setDraft((current) => {
      const exists = current.platforms.includes(value);
      return {
        ...current,
        platforms: exists ? current.platforms.filter((item) => item !== value) : [...current.platforms, value]
      };
    });
  }

  function saveDraft() {
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
    setCopied("บันทึกแล้ว");
    window.setTimeout(() => setCopied(""), 1600);
  }

  async function copyText(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1600);
  }

  return (
    <div className="lg-page lg-editorial-page bo-page">
      <header className="lg-topbar lg-report-topbar">
        <div className="lg-container lg-topbar-inner">
          <Link className="lg-brand lg-report-brand" href="/reports/laglace-clean-social-report">
            <span>LG</span>
            <div>
              <strong>LA GLACE</strong>
              <small>ศูนย์ตั้งค่าการกวาดข้อมูล</small>
            </div>
          </Link>
          <nav className="lg-report-tabs" aria-label="เมนูหลัก">
            <Link href="/reports/laglace-clean-social-report">รายงาน</Link>
            <Link href="/reports/laglace-clean-social-report/engagement">Engagement</Link>
            <Link href="/reports/laglace-clean-social-report#stream">เสียงผู้บริโภค</Link>
            <Link href="/backoffice" className="active">Backoffice</Link>
          </nav>
          <div className="lg-top-actions lg-report-actions">
            <span className="lg-live"><i />{draft.dateFrom} ถึง {draft.dateTo}</span>
          </div>
        </div>
      </header>

      <main className="lg-container lg-main bo-main">
        <section className="bo-hero">
          <p className="lg-kicker">Backoffice</p>
          <h1>ตั้งค่าการกวาดข้อมูลแบบไม่แก้คีย์เวิร์ด</h1>
          <p>ใช้คำที่กรอกแบบเดิมทั้งหมด เพื่อเก็บเป็นหลักฐานของ run และส่งต่อให้ JEV วิเคราะห์ภายหลัง</p>
        </section>

        <section className="bo-grid">
          <article className="bo-panel bo-control-panel">
            <div className="bo-panel-head">
              <span><Search size={18} /></span>
              <div>
                <h2>ชุดข้อมูลที่จะกวาด</h2>
                <p>กรอกค่าเริ่มต้นของรอบนี้โดยไม่ให้ระบบแก้คำ</p>
              </div>
            </div>

            <div className="bo-form-grid">
              <label>
                <span>ชื่อแคมเปญ</span>
                <input value={draft.campaignName} onChange={(event) => update("campaignName", event.target.value)} />
              </label>
              <label>
                <span>รหัสรายงาน</span>
                <input value={draft.reportSlug} onChange={(event) => update("reportSlug", event.target.value)} />
              </label>
              <label>
                <span>วันที่เริ่ม</span>
                <input type="date" value={draft.dateFrom} onChange={(event) => update("dateFrom", event.target.value)} />
              </label>
              <label>
                <span>วันที่สิ้นสุด</span>
                <input type="date" value={draft.dateTo} onChange={(event) => update("dateTo", event.target.value)} />
              </label>
            </div>

            <div className="bo-platforms" aria-label="เลือกแพลตฟอร์ม">
              {["TikTok", "Facebook", "Instagram", "X"].map((platform) => (
                <button
                  key={platform}
                  type="button"
                  className={draft.platforms.includes(platform) ? "active" : ""}
                  onClick={() => togglePlatform(platform)}
                >
                  {platform}
                </button>
              ))}
            </div>

            <label className="bo-keyword-box">
              <span>คีย์เวิร์ดดิบ</span>
              <textarea value={draft.keywords} onChange={(event) => update("keywords", event.target.value)} spellCheck={false} />
            </label>

            <label className="bo-keyword-box small">
              <span>หมายเหตุสำหรับ JEV</span>
              <textarea value={draft.note} onChange={(event) => update("note", event.target.value)} spellCheck={false} />
            </label>

            <div className="bo-actions">
              <button type="button" onClick={saveDraft}><Save size={16} />บันทึกในเครื่อง</button>
              <button type="button" onClick={() => copyText("คัดลอกคำสั่งแล้ว", commands)}><Clipboard size={16} />คัดลอกคำสั่ง</button>
            </div>
            {copied ? <p className="bo-toast">{copied}</p> : null}
          </article>

          <aside className="bo-panel bo-preview-panel">
            <div className="bo-panel-head">
              <span><Database size={18} /></span>
              <div>
                <h2>โครงข้อมูล NoSQL</h2>
                <p>แยก raw, normalized และประวัติ run ตั้งแต่ต้น</p>
              </div>
            </div>

            <div className="bo-model-stack">
              <ModelCard title="collection_runs" detail="เก็บ config ดิบ ช่วงวันที่ แพลตฟอร์ม และสถานะการรัน" />
              <ModelCard title="raw_records" detail="เก็บ JSON ดิบจาก Apify หรือ provider อื่นแบบไม่แตะ field" />
              <ModelCard title="normalized_records" detail="เก็บข้อมูลที่ map แล้วสำหรับกราฟ ตาราง และหลักฐาน" />
            </div>

            <div className="bo-run-buttons">
              <button type="button" onClick={() => copyText("คัดลอก input X แล้ว", JSON.stringify(xSearchInput, null, 2))}>
                <FileJson size={16} />คัดลอก input X
              </button>
              <button type="button" onClick={() => copyText("คัดลอก run config แล้ว", JSON.stringify(runConfig, null, 2))}>
                <Play size={16} />คัดลอก run config
              </button>
            </div>
          </aside>
        </section>

        <section className="bo-output-grid">
          <OutputCard title="input สำหรับ X Search" icon={<CalendarDays size={17} />} value={JSON.stringify(xSearchInput, null, 2)} />
          <OutputCard title="run config สำหรับเก็บประวัติ" icon={<FileJson size={17} />} value={JSON.stringify(runConfig, null, 2)} />
          <OutputCard title="คำสั่งรัน" icon={<Play size={17} />} value={commands} />
        </section>
      </main>
    </div>
  );
}

function ModelCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

function OutputCard({ title, icon, value }: { title: string; icon: React.ReactNode; value: string }) {
  return (
    <article className="bo-output-card">
      <div>
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      <pre>{value}</pre>
    </article>
  );
}

function addOneDay(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
