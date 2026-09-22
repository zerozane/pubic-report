import type { ReportSummary } from "@/lib/types";

const shortDateFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Bangkok",
});

export default function TimelineChart({ summary: s, timezone }: { summary: ReportSummary; timezone: string }) {
  const max = Math.max(...s.daily.map((item) => item.total), 1);
  const peak = s.peakDay;

  return (
    <article className="card compact-timeline-card">
      <div className="chart-key">
        <div>
          <span className="section-side">ความเคลื่อนไหวของบทสนทนา</span>
          <h3 className="card-title">ปริมาณคอมเมนต์รายวัน</h3>
        </div>
        {peak ? <strong className="peak-chip">พีก {formatShortDate(peak.date)} · {peak.total.toLocaleString("th-TH")}</strong> : null}
      </div>

      {s.daily.length ? (
        <div className="compact-timeline" aria-label="ปริมาณโพสต์และความคิดเห็นรายวัน">
          <div className="timeline-plot">
            {s.daily.map((item) => {
              const totalHeight = Math.max((item.total / max) * 100, 4);
              const postPercent = item.total ? (item.posts / item.total) * 100 : 0;
              const commentPercent = Math.max(100 - postPercent, 0);

              return (
                <div className="timeline-day" key={item.date}>
                  {peak?.date === item.date ? <span className="peak-label">{item.total.toLocaleString("th-TH")}</span> : null}
                  <div className="timeline-bar" style={{ height: `${totalHeight}%` }} title={`${formatShortDate(item.date)} · ${item.total.toLocaleString("th-TH")} รายการ`}>
                    {item.posts ? <span className="post-segment" style={{ height: `${postPercent}%` }} /> : null}
                    {item.comments ? <span className="comment-segment" style={{ height: `${commentPercent}%` }} /> : null}
                  </div>
                  <span className="timeline-date">{formatShortDate(item.date)}</span>
                </div>
              );
            })}
          </div>
          <div className="timeline-legend">
            <span><i className="legend-post" />โพสต์ต้นทาง</span>
            <span><i className="legend-comment" />ความคิดเห็น</span>
          </div>
        </div>
      ) : (
        <div className="chart-empty">
          <span className="empty-chart" aria-hidden="true">▂ ▄ ▆ ▃ ▅ ▇</span>
          <strong>รอข้อมูลการพูดถึง</strong>
          <p>แนวโน้มจะแสดงเมื่อมีโพสต์และความคิดเห็นในช่วงที่ศึกษา</p>
        </div>
      )}

      <p className="chart-caption">
        วันที่เผยแพร่ตามเวลา {timezone}
        {peak ? ` · กระแสสูงสุดวันที่ ${formatShortDate(peak.date)}` : ""}
      </p>
    </article>
  );
}

function formatShortDate(date: string) {
  if (!date || Number.isNaN(Date.parse(date))) return "ไม่ทราบวัน";
  return shortDateFormatter.format(new Date(date));
}
