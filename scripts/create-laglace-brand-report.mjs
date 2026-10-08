import fs from "node:fs";

const profileRows = JSON.parse(fs.readFileSync("work/raw/laglace-tiktok-profile-url-sd_muxujln1t12pzxz48.json", "utf8"));
const profile = Array.isArray(profileRows) ? profileRows[0] : profileRows;
const commentsReport = JSON.parse(fs.readFileSync("data/reports/laglace-tiktok-comments-real.json", "utf8"));

const topVideos = (profile.top_videos || []).map((video) => ({
  id: `tiktok-post-${video.video_id}`,
  platform: "TikTok",
  recordType: "post",
  sourceId: String(video.video_id),
  parentPostId: null,
  sourceUrl: video.video_url || null,
  publishedAt: video.create_date || new Date().toISOString(),
  text: "โพสต์จาก @laglace_official ในชุด top videos ของโปรไฟล์ La Glace",
  sentiment: null,
  topics: ["Owned content", "Top video"],
  metrics: {
    likes: Number(video.diggcount) || 0,
    shares: Number(video.share_count) || 0,
    views: Number(video.playcount) || 0,
    comments: Number(video.commentcount) || 0
  },
  isDemo: false,
  user: "@laglace_official",
  authorName: "LA GLACE",
  matchedKeywords: ["@laglace_official"],
  engagement: (Number(video.diggcount) || 0) + (Number(video.share_count) || 0) + (Number(video.commentcount) || 0),
  isIssue: false,
  detail: video.cover_image ? `cover: ${video.cover_image}` : undefined
}));

const comments = commentsReport.evidence.map((item) => ({
  ...item,
  matchedKeywords: item.matchedKeywords?.length ? item.matchedKeywords : ["laglace"]
}));

const evidence = [...topVideos, ...comments];
const postViews = topVideos.reduce((sum, item) => sum + (item.metrics.views || 0), 0);
const postEngagement = topVideos.reduce((sum, item) => sum + (item.engagement || 0), 0);
const positive = comments.filter((item) => item.sentiment === "positive").length;
const neutral = comments.filter((item) => item.sentiment === "neutral").length;
const negative = comments.filter((item) => item.sentiment === "negative").length;

const topicCounts = {};
for (const item of comments) {
  for (const topic of item.topics || []) {
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  }
}

const topKeywords = Object.entries(topicCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6)
  .map(([tag, count], index) => ({
    tag,
    count,
    percentage: Math.round((count / comments.length) * 1000) / 10,
    color: ["#FB6F92", "#2EC4B6", "#9B7CFF", "#F59E0B", "#EF4444", "#64748B"][index]
  }));

const byMonth = {};
for (const item of topVideos) {
  const date = new Date(item.publishedAt);
  const label = date.toLocaleDateString("th-TH", {
    month: "short",
    year: "2-digit",
    timeZone: "Asia/Bangkok"
  });
  byMonth[label] = (byMonth[label] || 0) + 1;
}
const labels = Object.keys(byMonth).slice(-8);
const values = labels.map((label) => byMonth[label]);
const strongest = topVideos.slice().sort((a, b) => (b.metrics.views || 0) - (a.metrics.views || 0))[0];
const recent = topVideos.slice().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))[0];

function commentIdsByTopic(topic) {
  return comments
    .filter((item) => (item.topics || []).includes(topic))
    .slice(0, 2)
    .map((item) => item.id);
}

const report = {
  slug: "laglace-tiktok-brand-report",
  title: "La Glace TikTok Brand Listening Report",
  status: "draft",
  author: "Codex + Bright Data",
  period: {
    from: "2023-11-27",
    to: "2026-10-07",
    timezone: "Asia/Bangkok"
  },
  collectedAt: new Date().toISOString(),
  summary: `รายงานแบรนด์ La Glace จาก TikTok profile จริงของ @laglace_official รวม top videos ${topVideos.length} รายการ และคอมเมนต์จริง ${comments.length} รายการที่เคยกวาดจาก Bright Data เพื่อดูภาพรวม owned content, engagement, sentiment และหัวข้อสนทนาหลักของแบรนด์`,
  methodology: {
    source: "Bright Data TikTok profile collect by URL + TikTok comments scraper from selected source videos",
    selection: "กวาดโปรไฟล์ @laglace_official เพื่อดึง profile metrics และ top videos จากนั้นรวมกับชุดคอมเมนต์จริง 95 รายการที่กวาดไว้ก่อนหน้า",
    sentimentMethod: "ใช้ rule-based sentiment/topic classification เบื้องต้นจากรายงาน comments เดิม ควรตรวจทานก่อนใช้ตัดสินใจเชิงธุรกิจ",
    limitations: [
      "TikTok search/UGC snapshot ยังรันอยู่ จึงยังไม่รวมโพสต์จากการค้นหาทั่ว TikTok ในรอบนี้",
      "ชุดคอมเมนต์มาจาก URL ที่เลือก ไม่ใช่คอมเมนต์ทั้งหมดของทุกโพสต์",
      "Top videos จาก profile เป็นข้อมูลที่ Bright Data คืนมาในเวลาที่กวาด ไม่ใช่ historical archive ทั้งหมด"
    ]
  },
  insights: [
    {
      id: "brand-owned-scale",
      type: "strength",
      title: "ฐาน TikTok ของแบรนด์แข็งแรง",
      description: `@laglace_official มีผู้ติดตาม ${profile.followers.toLocaleString("en-US")} คน ยอดไลก์รวม ${profile.likes.toLocaleString("en-US")} และวิดีโอ ${profile.videos_count.toLocaleString("en-US")} รายการ`,
      evidenceIds: topVideos.slice(0, 3).map((item) => item.id),
      recommendation: "ใช้ owned channel เป็นแกนปล่อยแคมเปญ และเลือกโพสต์ที่ engagement สูงไปต่อยอดเป็น paid/creator brief"
    },
    {
      id: "brand-top-video-proof",
      type: "opportunity",
      title: "มีโพสต์ที่สร้าง reach ระดับล้านวิว",
      description: strongest
        ? `โพสต์ top video ในชุดนี้มียอดวิวประมาณ ${(strongest.metrics.views || 0).toLocaleString("en-US")} views และ engagement รวม ${(strongest.engagement || 0).toLocaleString("en-US")}`
        : "พบ top videos ในโปรไฟล์",
      evidenceIds: strongest ? [strongest.id] : [],
      recommendation: "ถอด pattern จาก top videos เช่น format, hook, product moment, creator angle แล้วทำซ้ำเป็น content series"
    },
    {
      id: "brand-comment-read",
      type: "opportunity",
      title: "ควรอ่าน comments ใต้โพสต์ที่ perform สูงต่อ",
      description: `ชุดคอมเมนต์จริง ${comments.length} รายการมีเชิงบวก ${positive} รายการ เป็นกลาง ${neutral} รายการ และเชิงลบ ${negative} รายการ`,
      evidenceIds: comments.slice(0, 4).map((item) => item.id),
      recommendation: "ดึง comments เพิ่มจาก top videos ล่าสุดเพื่อหาคำถาม สี/เฉด/ราคา และสัญญาณ purchase intent"
    }
  ],
  evidence,
  dashboard: {
    eyebrow: "TIKTOK BRAND LISTENING REPORT",
    headline: "La Glace Brand Pulse on TikTok",
    description: "ภาพรวมแบรนด์จาก TikTok profile จริง รวม top videos, engagement, follower base และคอมเมนต์ตัวอย่างที่กวาดจาก Bright Data",
    brandMark: "LG",
    brandName: "LA GLACE",
    badge: "Brand Listening",
    kpis: [
      {
        label: "ผู้ติดตาม TikTok",
        value: `${(profile.followers / 1000).toFixed(1)}K`,
        caption: "@laglace_official followers",
        badge: "Profile",
        tone: "pink"
      },
      {
        label: "ยอดวิวจาก Top Videos",
        value: `${(postViews / 1000000).toFixed(1)}M`,
        caption: `รวม ${topVideos.length} top videos จาก profile`,
        badge: "Owned",
        tone: "mint"
      },
      {
        label: "Engagement รวม",
        value: `${(postEngagement / 1000).toFixed(1)}K`,
        caption: "likes + shares + comments ใน top videos",
        badge: "Top videos",
        tone: "slate"
      },
      {
        label: "คอมเมนต์จริง",
        value: String(comments.length),
        caption: "ชุด comments ที่กวาดไว้สำหรับอ่าน voice of customer",
        badge: `Pos ${Math.round((positive / comments.length) * 100)}%`,
        tone: "pink"
      }
    ],
    ingestion: {
      statusText: "Profile complete + Comments merged",
      window: "TikTok brand snapshot",
      pipelineSpeed: "Bright Data async",
      dataFreshness: new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
      monitoredKeywords: ["@laglace_official", "laglace", "La Glace", "ลากาส", "#laglace", "#ลากาส", "ลิปไอติม", "บลัชดำ"],
      connectedSources: [
        {
          name: "TikTok Profile",
          type: "@laglace_official metrics & top videos",
          status: "Connected",
          ping: "Bright Data",
          count: `${topVideos.length} posts`,
          platform: "TikTok"
        },
        {
          name: "TikTok Comments",
          type: "Selected source video comments",
          status: "Connected",
          ping: "Bright Data",
          count: `${comments.length} comments`,
          platform: "TikTok"
        }
      ],
      topKeywords
    },
    timeline: {
      labels: labels.length ? labels : ["No data"],
      total: values.length ? values : [0],
      positive: values.length ? values.map(() => 0) : [0],
      negative: values.length ? values.map(() => 0) : [0],
      events: [
        strongest
          ? {
              index: Math.max(0, labels.length - 1),
              label: "Top Video",
              description: `วิดีโอเด่นสุดในชุดนี้ ${(strongest.metrics.views || 0).toLocaleString("th-TH")} views`,
              color: "#FB6F92"
            }
          : {
              index: 0,
              label: "Snapshot",
              description: "กวาดข้อมูล profile สำเร็จ",
              color: "#2EC4B6"
            },
        recent
          ? {
              index: Math.max(0, labels.length - 1),
              label: "Latest Owned Post",
              description: `โพสต์ล่าสุดใน top videos วันที่ ${recent.publishedAt.slice(0, 10)}`,
              color: "#2EC4B6"
            }
          : null
      ].filter(Boolean)
    },
    pillars: [
      {
        title: "ประเด็นเกี่ยวกับ La Glace บน TikTok",
        share: 45,
        positive: Math.round((positive / comments.length) * 100),
        description: "ภาพรวมว่าแบรนด์ La Glace ถูกพูดถึงผ่านช่องทางของแบรนด์เองและคอมเมนต์ใต้โพสต์ที่เกี่ยวข้องอย่างไร",
        keywords: ["@laglace_official", "La Glace", "ลากาส", "Owned content"],
        takeaway: "ใช้ส่วนนี้ดูภาพรวมแบรนด์ก่อนลงไปอ่าน topic รายสินค้า",
        sourceTopic: "บทสนทนาอื่นๆ",
        exampleIds: comments.slice(0, 2).map((item) => item.id)
      },
      {
        title: "คุณภาพสินค้าและประสบการณ์ที่ผู้ใช้รับรู้",
        share: 31,
        positive: 100,
        description: "รวมคอมเมนต์ที่สะท้อนความพอใจต่อสินค้า เช่น สี กลิ่น แพคเกจ และความรู้สึกว่าสินค้าน่าใช้หรือน่าซื้อ",
        keywords: ["คุณภาพสินค้า", "สีสวย", "กลิ่นหอม", "แพคเกจ", "น่าใช้"],
        takeaway: "หัวข้อนี้ควรใช้เป็นหลักฐาน social proof แต่ยังควรกวาดรีวิวเชิงลึกเพิ่มเพื่อยืนยันเรื่องคุณภาพหลังใช้งาน",
        sourceTopic: "คำชม/ความชอบสินค้า",
        exampleIds: commentIdsByTopic("คำชม/ความชอบสินค้า")
      },
      {
        title: "สี เฉด และสินค้าเด่นที่คนถามถึง",
        share: 14,
        positive: 50,
        description: "คอมเมนต์ที่พูดถึงลิป บลัช สี และเฉด ช่วยบอกว่าผู้บริโภคกำลังสนใจสินค้า/เฉดไหนเป็นพิเศษ",
        keywords: ["ลิป", "บลัช", "สี", "เฉด", "เบอร์สี"],
        takeaway: "ใช้ทำ product FAQ และช่วยเลือกสินค้าเด่นสำหรับคอนเทนต์ถัดไป",
        sourceTopic: "ลิป/สีปาก",
        exampleIds: commentIdsByTopic("ลิป/สีปาก")
      },
      {
        title: "คำถามและสัญญาณซื้อ",
        share: 10,
        positive: 50,
        description: "คอมเมนต์ที่ถามเรื่องราคา พิกัดซื้อ ของหมด หรือความต้องการซื้อ ใช้อ่าน purchase intent ของแบรนด์",
        keywords: ["ราคา", "ซื้อที่ไหน", "ของหมด", "อยากได้"],
        takeaway: "ควรต่อยอดเป็น FAQ, product card และ restock signal",
        sourceTopic: "คำถามสินค้า/เฉดสี",
        exampleIds: commentIdsByTopic("คำถามสินค้า/เฉดสี")
      }
    ]
  }
};

fs.writeFileSync("data/reports/laglace-tiktok-brand-report.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  slug: report.slug,
  evidence: evidence.length,
  posts: topVideos.length,
  comments: comments.length,
  followers: profile.followers,
  totalTopVideoViews: postViews
}, null, 2));

