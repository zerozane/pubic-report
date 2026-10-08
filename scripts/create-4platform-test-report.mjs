import fs from "node:fs";

const tiktok = JSON.parse(fs.readFileSync("data/reports/laglace-tiktok-comments-real.json", "utf8"));
const youtubeRaw = JSON.parse(fs.readFileSync("work/raw/laglace-youtube-comments-test-10-sd_muy6vwb8204ccyjefu.json", "utf8"));
const instagramRaw = JSON.parse(fs.readFileSync("work/raw/laglace-instagram-comments-discovered-10-sd_muy7qcr2mu6dw3inr.json", "utf8"));
const facebookRaw = JSON.parse(fs.readFileSync("work/raw/laglace-facebook-comments-discovered-10-sd_muy8ccfs24ngi2a596.json", "utf8"));

const youtubeEvidence = youtubeRaw.map((item, index) => ({
  id: `youtube-${item.comment_id || index + 1}`,
  platform: "YouTube",
  recordType: "comment",
  sourceId: item.comment_id || null,
  parentPostId: item.video_id || null,
  sourceUrl: item.url || null,
  publishedAt: item.date_iso || item.timestamp || new Date().toISOString(),
  text: item.comment_text || "",
  sentiment: null,
  topics: ["YouTube review comments"],
  metrics: { likes: Number(item.likes) || 0, replies: Number(item.replies) || 0 },
  isDemo: false,
  user: item.username || "",
  authorName: item.username || "",
  matchedKeywords: ["La Glace", "YouTube"],
  engagement: (Number(item.likes) || 0) + (Number(item.replies) || 0),
  isIssue: false
}));

const instagramEvidence = instagramRaw.map((item, index) => ({
  id: `instagram-${item.comment_id || index + 1}`,
  platform: "Instagram",
  recordType: "comment",
  sourceId: item.comment_id || null,
  parentPostId: item.post_url || null,
  sourceUrl: item.post_url || item.url || null,
  publishedAt: item.comment_date || item.timestamp || new Date().toISOString(),
  text: item.comment || "",
  sentiment: null,
  topics: ["Instagram official post comments"],
  metrics: { likes: Number(item.likes_number) || 0, replies: Number(item.replies_number) || 0 },
  isDemo: false,
  user: item.comment_user || "",
  authorName: item.comment_user || "",
  matchedKeywords: ["La Glace", "Instagram"],
  engagement: (Number(item.likes_number) || 0) + (Number(item.replies_number) || 0),
  isIssue: false
}));

const facebookEvidence = facebookRaw.map((item, index) => ({
  id: `facebook-${item.comment_id || index + 1}`,
  platform: "Facebook",
  recordType: "comment",
  sourceId: item.comment_id || null,
  parentPostId: item.post_id || null,
  sourceUrl: item.post_url || item.url || item.comment_link || null,
  publishedAt: item.date_created || item.timestamp || new Date().toISOString(),
  text: item.comment_text || "",
  sentiment: null,
  topics: ["Facebook official page comments"],
  metrics: { likes: Number(item.num_likes) || 0, replies: 0 },
  isDemo: false,
  user: item.user_name || "",
  authorName: item.user_name || "",
  matchedKeywords: ["La Glace", "Facebook"],
  engagement: Number(item.num_likes) || 0,
  isIssue: false
}));

const tiktokEvidence = tiktok.evidence.map((item) => ({ ...item }));
const evidence = [...tiktokEvidence, ...youtubeEvidence, ...instagramEvidence, ...facebookEvidence];
const comments = evidence.filter((item) => item.recordType === "comment");
const positive = comments.filter((item) => item.sentiment === "positive").length;
const neutral = comments.filter((item) => item.sentiment === "neutral" || item.sentiment === null).length;
const negative = comments.filter((item) => item.sentiment === "negative").length;

const report = {
  slug: "laglace-4platform-test-100",
  title: "La Glace 4-Platform Pipeline Test 100+ Records",
  status: "draft",
  author: "Codex + Bright Data",
  period: { from: "2023-11-27", to: "2026-10-07", timezone: "Asia/Bangkok" },
  collectedAt: new Date().toISOString(),
  summary: `รายงานทดสอบ pipeline รวมข้อมูลจริง ${evidence.length} records จาก TikTok ${tiktokEvidence.length} comments, YouTube ${youtubeEvidence.length} comments และ Instagram ${instagramEvidence.length} comments โดย Facebook ยังรอ page URL ที่ Bright Data เข้าถึงได้`,
  methodology: {
    source: "Bright Data TikTok comments + Instagram posts discover/comments + YouTube comments + Facebook page posts/comments",
    selection: "ใช้ TikTok comments ที่กวาดจริง 95 รายการ, YouTube comments 10 รายการ และ Instagram comments 10 รายการจาก post URL ที่ discover จาก @laglace_official",
    sentimentMethod: "TikTok ใช้ rule classification เดิม ส่วน YouTube/Instagram ยังไม่ classify sentiment ในรอบทดสอบนี้",
    limitations: [
      "Facebook page URLs ที่ลองถูก Bright Data คืน dead_page จึงยังไม่มี Facebook comments",
      "YouTube เป็น test จากวิดีโอเดียว จำกัด 10 comments",
      "Instagram เป็น test จาก official post URL แรกที่ discover ได้ จำกัด 10 comments"
    ]
  },
  insights: [
    {
      id: "pipeline-100-ready",
      type: "strength",
      title: "Pipeline ได้ข้อมูลจริงเกิน 100 records แล้ว",
      description: `รวมข้อมูลจริง ${evidence.length} records จาก TikTok, YouTube และ Instagram`,
      evidenceIds: evidence.slice(0, 6).map((item) => item.id),
      recommendation: "ใช้ชุดนี้ตรวจ layout/report logic ก่อน แล้วเติม Facebook หลังได้ page URL ที่ scraper เข้าถึงได้"
    },
    {
      id: "instagram-discover-ready",
      type: "strength",
      title: "Instagram discover → comments ใช้งานได้จริง",
      description: "Instagram Posts Discover by URL หา post URL จาก @laglace_official ได้ 5 posts และดึง comments จาก post แรกได้ 10 records",
      evidenceIds: instagramEvidence.slice(0, 4).map((item) => item.id),
      recommendation: "ขยายเป็นหลาย post และคุม comments ต่อ post เพื่อเพิ่ม sample อย่างประหยัดเครดิต"
    }
  ],
  evidence,
  dashboard: {
    eyebrow: "ภาพรวมเสียงตอบรับจาก Social Listening",
    headline: "เสียงตอบรับต่อ La Glace จาก 4 แพลตฟอร์ม",
    description: "ชุดทดสอบรวม TikTok, Instagram และ YouTube ที่กวาดได้จริง พร้อมสถานะ Facebook discovery",
    brandMark: "LG",
    brandName: "LA GLACE",
    badge: "รายงานเสียงผู้บริโภค",
    kpis: [
      { label: "Records จริง", value: String(evidence.length), caption: "TikTok + Instagram + YouTube", badge: "100+", tone: "pink" },
      { label: "TikTok Comments", value: String(tiktokEvidence.length), caption: "กวาดจริงจาก Bright Data", badge: "Ready", tone: "mint" },
      { label: "IG + YouTube", value: String(instagramEvidence.length + youtubeEvidence.length), caption: "Discover/test comments", badge: "Ready", tone: "slate" },
      { label: "รอเติม", value: "Facebook", caption: "dead_page จาก URL ที่ลอง", badge: "Pending", tone: "red" }
    ],
    ingestion: {
      statusText: "กวาดข้อมูลจริงครบ 4 แพลตฟอร์มในรอบทดสอบ",
      window: "รอบทดสอบ 30 ก.ย. - 7 ต.ค. 2026",
      pipelineSpeed: "Bright Data async",
      dataFreshness: new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
      monitoredKeywords: ["laglace", "La Glace", "ลากาส", "ลิปไอติม", "บลัชดำ", "YouTube review", "@laglace_official", "laglace.officialth"],
      connectedSources: [
        { name: "TikTok Comments", type: "Selected video comments", status: "Connected", count: `${tiktokEvidence.length} comments`, platform: "TikTok" },
        { name: "Instagram Comments", type: "Official post comments", status: "Connected", count: `${instagramEvidence.length} comments`, platform: "Instagram" },
        { name: "YouTube Comments", type: "Review video comments", status: "Connected", count: `${youtubeEvidence.length} comments`, platform: "YouTube" },
        { name: "Facebook Comments", type: "Official page post comments", status: "Connected", count: `${facebookEvidence.length} comments`, platform: "Facebook" }
      ],
      topKeywords: [
        { tag: "TikTok comments", count: tiktokEvidence.length, percentage: Math.round((tiktokEvidence.length / evidence.length) * 100), color: "#2EC4B6" },
        { tag: "Instagram comments", count: instagramEvidence.length, percentage: Math.round((instagramEvidence.length / evidence.length) * 100), color: "#FB6F92" },
        { tag: "YouTube comments", count: youtubeEvidence.length, percentage: Math.round((youtubeEvidence.length / evidence.length) * 100), color: "#9B7CFF" },
        { tag: "Facebook comments", count: facebookEvidence.length, percentage: Math.round((facebookEvidence.length / evidence.length) * 100), color: "#1877F2" }
      ]
    },
    timeline: { labels: ["TikTok", "Instagram", "YouTube", "Facebook"], total: [tiktokEvidence.length, instagramEvidence.length, youtubeEvidence.length, facebookEvidence.length], positive: [positive, 0, 0, 0], negative: [negative, 0, 0, 0], events: [] },
    pillars: []
  }
};

fs.writeFileSync("data/reports/laglace-4platform-test-100.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ slug: report.slug, evidence: evidence.length, tiktok: tiktokEvidence.length, instagram: instagramEvidence.length, youtube: youtubeEvidence.length, facebook: facebookEvidence.length }, null, 2));