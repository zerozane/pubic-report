import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function ReportNavigation({ slug, evidencePage = false }: { slug: string; evidencePage?: boolean }) {
  const base = `/reports/${slug}`;
  const items = [
    ["overview", "ภาพรวม"],
    ["findings", "ข้อค้นพบ"],
    ["trend", "แนวโน้ม"],
    ["topics", "ประเด็น"],
    ["method", "วิธีการ"],
  ];

  return (
    <aside className="sidebar" aria-label="เมนูรายงาน">
      <Link className="logo" href="/">
        <span className="mark"><ArrowUpRight size={19} /></span>
        PUBLIC / NOTE
      </Link>
      <p className="smallcap">Audience intelligence</p>
      <nav className="nav">
        {items.map(([id, label], index) => (
          <Link href={`${base}#${id}`} key={id}>
            <span>0{index + 1}</span>
            {label}
          </Link>
        ))}
        <Link
          href={`${base}/evidence`}
          className={evidencePage ? "active" : ""}
          aria-current={evidencePage ? "page" : undefined}
        >
          <span>06</span>
          หลักฐานทั้งหมด
        </Link>
      </nav>
      <div className="sidefoot">
        <span className="live-dot" />
        รายงานตามรอบข้อมูล
        <br />
        TikTok · ตรวจสอบแหล่งที่มาได้
      </div>
    </aside>
  );
}
