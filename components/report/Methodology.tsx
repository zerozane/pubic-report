import { sentimentStandard } from "@/lib/sentiment-standard";
import type { Report } from "@/lib/types";

const sectionNum = "05 / วิธีเก็บข้อมูล";
const heading = "ข้อมูลนี้เก็บมาอย่างไร";
const sourceLabel = "แหล่งข้อมูล:";
const methodLabel = "มาตรฐาน sentiment:";
const examplesLabel = "ตัวอย่าง:";

export default function Methodology({ report }: { report: Report }) {
  return (
    <section className="section card method" id="method">
      <div>
        <span className="section-num">{sectionNum}</span>
        <h2>{heading}</h2>
        <p>{report.methodology.selection}</p>
      </div>
      <ol>
        <li><strong>{sourceLabel}</strong> {report.methodology.source}</li>
        <li><strong>{methodLabel}</strong> {report.methodology.sentimentMethod}</li>
        {sentimentStandard.map((item) => (
          <li key={item.value}>
            <strong>{item.label}:</strong> {item.definition} <span>{examplesLabel} {item.examples.join(", ")}</span>
          </li>
        ))}
        {report.methodology.limitations.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  );
}
