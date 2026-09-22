import fs from "node:fs";

const reportPath = "data/reports/iphone-18-selected-tiktok.json";
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

report.title = "ราคาและมุกประชดคือแรงต้านหลักของ iPhone 18 บน TikTok";
report.summary =
  "จาก 2 โพสต์ TikTok และ 2,378 คอมเมนต์ กระแส iPhone 18 ไม่ได้เป็นบวกตรงไปตรงมา แม้ยังมีคนอยากได้และรอซื้อ แต่เสียงที่ควรอ่านมากที่สุดคือความกังวลเรื่องราคา ความคุ้มค่า และมุกประชดที่บอกว่าเงินก้อนเดียวกันอาจเอาไปทำอย่างอื่นได้คุ้มกว่า";
report.methodology = {
  ...report.methodology,
  selection:
    "เลือก 2 โพสต์ TikTok ภาษาไทยที่มีบทสนทนาเกี่ยวกับ iPhone 18 เด่นชัด แล้วดึงคอมเมนต์เชิงลึกเพื่ออ่าน pattern เรื่องราคา ความคุ้มค่า การรอซื้อ และมุกประชด",
  sentimentMethod:
    "จัดประเภทด้วยกฎเบื้องต้น แล้วไล่อ่าน high-priority text groups ด้วย AI/manual review พร้อม override ราย ID โดยเน้นแยก sarcasm ออกจาก intent ซื้อจริง",
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ title: report.title, summary: report.summary }, null, 2));
