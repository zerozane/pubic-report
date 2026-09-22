import type { Report } from "@/lib/types";

export default function Methodology({ report }: { report: Report }) {
  return (
    <section className="section card method" id="method">
      <div>
        <span className="section-num">05 / METHODOLOGY</span>
        <h2>เบื้องหลังรายงาน</h2>
        <p>{report.methodology.selection}</p>
      </div>
      <ol>
        <li><strong>แหล่งข้อมูล:</strong> {report.methodology.source}</li>
        <li><strong>การวิเคราะห์:</strong> {report.methodology.sentimentMethod}</li>
        {report.methodology.limitations.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  );
}
