# Public One-off Report — Tech Stack & Structure

เอกสารสำหรับพัฒนารายงานสาธารณะด้วย **Next.js + Bright Data** โดยเก็บข้อมูลเป็น **ไฟล์ JSON ในโปรเจกต์** ไม่มีฐานข้อมูลหรือ backend แยก เหมาะกับรายงานที่เก็บข้อมูลเป็นรอบ ตรวจทาน แล้วเผยแพร่ฉบับคงที่

## 1. เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี | หน้าที่ |
| --- | --- | --- |
| เว็บรายงาน | Next.js App Router + React + TypeScript | หน้ารวมรายงานและหน้ารายงานแต่ละหัวข้อ |
| รูปแบบหน้าจอ | global CSS | นำดีไซน์ HTML ต้นแบบมาแยกเป็น component รองรับมือถือและการพิมพ์ |
| กราฟ | SVG และ CSS | กราฟแนวโน้ม สัดส่วนความรู้สึก และแถบเปรียบเทียบ โดยไม่เพิ่มไลบรารีกราฟ |
| เก็บข้อมูลโซเชียล | Bright Data Web Scraper API | เก็บโพสต์และความคิดเห็นจาก scraper ที่เลือก |
| เรียก API / เตรียมข้อมูล | Node.js scripts ภายใน repo เดียวกัน + native fetch | สั่งเก็บ ตรวจสถานะ ดาวน์โหลด และแปลงข้อมูล |
| จัดเก็บ | JSON ในโปรเจกต์ | เก็บข้อมูลรายงานที่ตรวจทานแล้ว สำหรับนำไป build หน้าเว็บ |
| ค้นหาและกรอง | React state | กรองหลักฐานตามแพลตฟอร์ม ความรู้สึก และคำค้น |
| ส่งออก | Browser Print + CSV | บันทึก PDF ผ่านหน้าพิมพ์ และดาวน์โหลดข้อมูลที่อนุมัติให้เผยแพร่ |

ใช้ dependencies ตามโปรเจกต์ Next.js ปกติ ไม่เพิ่ม Prisma, Supabase, Firebase, MongoDB, PostgreSQL, Redis, ระบบ queue หรือบริการ AI ในขอบเขตเริ่มต้น

## 2. วิธีทำงานที่เลือก

```text
ผู้จัดทำกำหนดหัวข้อ + ช่วงเวลา + keyword/hashtag สำหรับ TikTok
                      ↓
สั่ง Bright Data ผ่านหน้า Dashboard หรือ script ในเครื่องผู้จัดทำ
                      ↓
ดาวน์โหลดผลลัพธ์ → work/raw/ (ข้อมูลดิบ ไม่เผยแพร่)
                      ↓
แปลงรูปแบบ → ตัดข้อมูลซ้ำ → คัดข้อมูลที่เกี่ยวข้อง
                      ↓
ผู้จัดทำจัดประเภทความรู้สึก/ประเด็น และเขียนข้อค้นพบ
                      ↓
สร้าง data/reports/<slug>.json ที่พร้อมเผยแพร่
                      ↓
Next.js อ่านข้อมูลตอน build → เผยแพร่เว็บรายงาน
                      ↓
ผู้อ่านดูกราฟ ค้นหา กรองหลักฐาน และพิมพ์ PDF
```

**หน้าเว็บสาธารณะอ่านข้อมูลที่เตรียมไว้เท่านั้น** การเปิดหรือรีเฟรชรายงานไม่เรียก Bright Data ใหม่ ไม่ต้องมี API สำหรับให้ผู้ชมสั่ง scrape

เมื่อปรับข้อมูลรายงาน ให้แก้หรือสร้าง JSON ใหม่ แล้ว build/deploy ใหม่ นี่คือรูปแบบ snapshot สำหรับ One-off report ไม่ใช่ dashboard แบบ real-time

## 3. การใช้ Bright Data

เริ่มต้นง่ายที่สุดด้วย Dashboard: เลือก scraper → ใส่ input → ทดลองเก็บ → ดาวน์โหลด JSON → นำเข้าโปรเจกต์ เมื่อทำซ้ำบ่อยขึ้นจึงใช้ scripts ที่อยู่ใน repo เดียวกัน

เลือก scraper ตาม **แพลตฟอร์มและชนิดข้อมูล** โดยเวอร์ชันแรกโฟกัสเฉพาะ TikTok ก่อน เริ่มจาก keyword/hashtag เพื่อค้นหาโพสต์ที่เกี่ยวข้อง แล้วจึงดึงความคิดเห็นจากรายการที่เลือก โดยตรวจ input และ output schema ของ scraper แต่ละตัวจริงก่อนเขียนตัวแปลงข้อมูล

ข้อกำหนดของข้อมูล:

- ต้องการวิเคราะห์เสียงตอบรับ ให้เก็บข้อความคอมเมนต์จริง ไม่ใช่เพียงตัวเลขจำนวนคอมเมนต์ของโพสต์
- ใช้ keyword/hashtag เป็นทางหลักของเวอร์ชันแรก เช่น TikTok Posts - discover by keyword และ TikTok Comments ตาม scraper ที่บัญชีรองรับ
- หาก scraper ใดคืนเฉพาะโพสต์หรือ reels ก่อน ให้บันทึก `postUrl` แล้วใช้ comments scraper ดึงความคิดเห็นเป็นขั้นต่อไป
- ยังไม่รวม Instagram หรือ Facebook ในเวอร์ชันแรก เพื่อลดความซับซ้อนของ schema, visibility และ keyword search
- ทดลองด้วยชุดเล็กก่อน ตรวจคุณภาพข้อความภาษาไทย วันเวลา ลิงก์ต้นทาง และการใช้เครดิต
- เก็บ dataset ID, snapshot ID, เวลาที่ดึง และขอบเขตการค้นหาไว้ในไฟล์งานภายใน เพื่อย้อนตรวจสอบได้
- Bright Data ทำหน้าที่เก็บข้อมูล ส่วนการจัดประเภทความรู้สึกและเขียนข้อค้นพบเป็นขั้นตอนแยก ในเวอร์ชันนี้ให้ผู้จัดทำตรวจทานเอง

### API flow สำหรับ scripts

```text
POST /datasets/v3/trigger?dataset_id=<ID ของ scraper>
  → บันทึก snapshot_id ลงไฟล์ภายใน

GET /datasets/v3/progress/<snapshot_id>
  → ตรวจสถานะเป็นช่วง ๆ มีเวลาสิ้นสุดและรองรับสถานะล้มเหลว

GET /datasets/v3/snapshot/<snapshot_id>?format=json
  → ดาวน์โหลดเมื่อพร้อม แล้วบันทึกลง work/raw/
```

ใส่ `Authorization: Bearer <API_KEY>` จาก environment ของเครื่องผู้จัดทำ ใช้ request body ตาม scraper ที่เลือก ไม่ใช้ schema เดียวครอบทุกแพลตฟอร์ม และไม่ trigger งานใหม่เมื่อเพียงต้องการตรวจงานเดิม

กระบวนการ trigger → ตรวจสถานะ → ดาวน์โหลด อ้างอิง [Bright Data: Monitor Progress](https://docs.brightdata.com/api-reference/web-scraper-api/management-apis/monitor-progress) และ [ตัวอย่าง API ของ Bright Data](https://github.com/brightdata/skills/blob/main/skills/bright-data-best-practices/references/web-scraper-api.md)

## 4. โครงสร้างโปรเจกต์

```text
public-report/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                       # รายการ Public reports
│   ├── globals.css                    # สี ฟอนต์ responsive และ print
│   └── reports/
│       └── [slug]/
│           ├── page.tsx               # ภาพรวมรายงาน
│           └── evidence/
│               └── page.tsx           # หลักฐานและตัวกรอง
├── components/
│   └── report/
│       ├── ReportNavigation.tsx
│       ├── ReportHeader.tsx
│       ├── SummaryCards.tsx
│       ├── KeyFindings.tsx
│       ├── SentimentChart.tsx
│       ├── TimelineChart.tsx
│       ├── TopicBreakdown.tsx
│       ├── EvidenceCard.tsx
│       ├── EvidenceExplorer.tsx       # Client Component
│       ├── ReportActions.tsx          # Client Component: print / CSV
│       └── Methodology.tsx
├── data/
│   └── reports/
│       ├── iphone-18.json             # draft สำหรับหัวข้อ iPhone 18
│       └── example-topic.json         # ข้อมูล demo สำหรับทดสอบหน้าจอ
├── lib/
│   ├── reports.ts                     # อ่านรายงาน/ค้นด้วย slug/คำนวณสรุป
│   └── types.ts                       # Report, Evidence, Insight
├── scripts/
│   ├── collect.mjs                    # เริ่มงาน Bright Data
│   ├── download.mjs                   # ตรวจงานเดิมและดาวน์โหลด
│   ├── normalize.mjs                  # แปลงและตัดซ้ำ
│   └── validate.mjs                   # ตรวจข้อมูลก่อน build
├── work/                              # gitignored / ไม่เผยแพร่
│   ├── jobs/
│   ├── raw/
│   └── reviewed/
├── public/
│   └── images/
├── .env.local                         # gitignored
├── .env.example                       # ชื่อตัวแปร ไม่มี secret
├── .gitignore
└── package.json
```

โครงสร้างนี้ถูกวางเป็นแอป Next.js แล้วในโปรเจกต์ปัจจุบัน โดยหน้า `/reports/iphone-18` เป็นฉบับร่างสำหรับหัวข้อ iPhone 18 และยังรอข้อมูล TikTok ที่ผ่านการตรวจทานก่อนใส่ข้อค้นพบจริง สคริปต์ทุกตัวเป็นส่วนหนึ่งของ repo เดียวกัน ไม่ต้องตั้งบริการ backend เพิ่ม

## 5. รูปแบบข้อมูล

ตัวอย่างโครงสร้าง JSON ขนาดเล็กนี้ใช้ **ข้อมูลสมมติ** เพียงหนึ่งรายการเพื่ออธิบาย schema:

```json
{
  "slug": "example-topic",
  "title": "เสียงตอบรับต่อ [ชื่อหัวข้อ]",
  "status": "demo",
  "author": "[ชื่อผู้จัดทำ]",
  "period": {
    "from": "2026-08-01",
    "to": "2026-08-07",
    "timezone": "Asia/Bangkok"
  },
  "collectedAt": "2026-08-08T03:00:00Z",
  "summary": "[ข้อสรุปหลังตรวจข้อมูล]",
  "methodology": {
    "source": "demo",
    "selection": "[คำค้น ลิงก์ และวิธีเลือกข้อมูล]",
    "sentimentMethod": "ผู้จัดทำตรวจทานและจัดประเภท",
    "limitations": ["ไม่ใช่บทสนทนาทั้งหมดบนโซเชียล"]
  },
  "insights": [
    {
      "id": "insight-01",
      "type": "strength",
      "title": "[ชื่อประเด็น]",
      "description": "[ข้อค้นพบที่มีหลักฐานรองรับ]",
      "evidenceIds": ["demo-01"],
      "recommendation": "[สิ่งที่ควรทำต่อ]"
    }
  ],
  "evidence": [
    {
      "id": "demo-01",
      "platform": "TikTok",
      "recordType": "comment",
      "sourceId": null,
      "parentPostId": null,
      "sourceUrl": null,
      "publishedAt": "2026-08-04T12:00:00+07:00",
      "text": "ข้อความสมมติสำหรับออกแบบ",
      "sentiment": "positive",
      "topics": ["ประสบการณ์"],
      "metrics": {"likes": 12, "replies": 2},
      "isDemo": true
    }
  ]
}
```

ใช้ `null` เมื่อไม่ทราบค่า ไม่แทนด้วย `0` ถ้ายังไม่ได้จัดประเภทให้ `sentiment` เป็น `null` ซึ่งต่างจาก `neutral` ส่วนรายงานจริงให้ `status` เป็น `published` และหลักฐานต้องมีแหล่งที่มาตรวจสอบได้

**คำนวณการ์ด กราฟ และตารางจากข้อมูลชุดเดียวกัน** ไม่เขียนตัวเลขสรุปแยกหลายจุดเหมือนไฟล์ดีไซน์ต้นแบบ เพื่อป้องกันยอดรวมไม่ตรงกัน

### สถานะ iPhone 18 ตอนนี้

ไฟล์ `data/reports/iphone-18.json` เป็นฉบับร่างแบบไม่มี evidence เพราะข้อมูลที่มีในโปรเจกต์ตอนนี้ยังไม่ใช่ข้อมูล iPhone 18 จึงไม่ควรนำมาทำข้อสรุปแทน เมื่อมีไฟล์ที่ผ่านการ normalize/review แล้ว ให้เติม `period`, `collectedAt`, `evidence`, `insights` และปรับ `status` เป็น `published` หลังตรวจว่าไม่มี `isDemo: true`

เส้นทางที่ใช้งาน:

- `/` รายการรายงานสาธารณะ
- `/reports/iphone-18` หน้าภาพรวมรายงาน
- `/reports/iphone-18/evidence` หน้าหลักฐานพร้อมค้นหาและกรองผ่าน URL query

คำสั่งตรวจงาน:

```bash
npm run validate:data
npm run build
npm run dev
```

กติกาคำนวณ:

- จำนวนโพสต์และความคิดเห็นแยกตาม `recordType` และนับจากรายการหลังตัดซ้ำ
- ความเห็นเชิงบวก (%) = จำนวน comment ที่เป็น positive ÷ จำนวน comment ที่จัดประเภทแล้ว × 100
- กราฟรายวันใช้ `publishedAt` ตาม timezone ของรายงาน ไม่ใช้วันดาวน์โหลด
- แสดง likes, replies, shares, views ตามที่มีจริง ไม่บวกยอดโพสต์และยอดคอมเมนต์ซ้ำเป็น engagement โดยไม่มีนิยาม
- ตัดซ้ำโดยใช้ platform + sourceId เมื่อมี ถ้าไม่มีต้องกำหนด fallback ที่ตรวจทานได้ ไม่ตัดเพียงเพราะข้อความเหมือนกัน
- กรณีไม่มีข้อมูลหรือไม่มีความคิดเห็นที่จัดประเภท ให้แสดง “ยังไม่มีข้อมูล” แทนเปอร์เซ็นต์ที่ทำให้เข้าใจผิด

## 6. รูปแบบหน้ารายงาน

ยึดลำดับการเล่าเรื่องของตัวอย่างเดิม แต่ใช้ดีไซน์จาก `public-report-template.html` เป็นฐาน:

1. **ภาพรวม:** ชื่อหัวข้อ ช่วงเวลา ข้อสรุป และภาพรวมความรู้สึก
2. **ตัวเลขสำคัญ:** จำนวนโพสต์/ความคิดเห็น ยอดที่นิยามชัด และวันพีก
3. **แนวโน้ม:** ปริมาณรายวัน พร้อมคำอธิบายเหตุการณ์ที่เกี่ยวข้อง
4. **แพลตฟอร์ม:** ปริมาณ สัดส่วน และบริบทของแต่ละช่องทาง
5. **ประเด็นสำคัญ:** จุดแข็ง ข้อกังวล โอกาส พร้อม evidence IDs รองรับ
6. **หลักฐาน:** ค้นหา กรองแพลตฟอร์ม/ความรู้สึก และเปิดลิงก์ต้นทาง
7. **วิธีการ:** ขอบเขต วิธีเก็บ วิธีวิเคราะห์ และข้อจำกัด

หน้ารวมรายงาน `/` เชื่อมไป `/reports/[slug]` และหน้า `/reports/[slug]/evidence` ใช้ข้อมูลชุดเดียวกัน รองรับตัวกรองใน URL เช่น `?platform=TikTok&sentiment=positive` เพื่อส่งลิงก์ให้ผู้อื่นเปิดมุมมองเดียวกันได้

## 7. การอ่านไฟล์และการเผยแพร่

- อ่านไฟล์ผ่าน server-side code ใน `lib/reports.ts` และสร้างหน้าเฉพาะ slug ที่อยู่ใน `data/reports/` เช่นใช้ `generateStaticParams`
- Server Components แสดงภาพรวม กราฟ และตาราง ส่วน Client Components รับเฉพาะข้อมูลที่อนุมัติให้เผยแพร่เพื่อค้นหา/กรอง/ดาวน์โหลด
- ไม่ส่ง raw response ทั้งก้อนไปยัง browser ส่งเฉพาะ fields ที่หน้ารายงานต้องใช้
- ไม่ใช้การเขียนไฟล์จากหน้าเว็บที่ deploy แล้วเป็นที่เก็บข้อมูลถาวร การสร้าง JSON ทำในเครื่องผู้จัดทำก่อน build เสมอ
- ไม่จำเป็นต้องมี API routes ในเวอร์ชันแรก และไม่ต้องเก็บ Bright Data API key บนโฮสต์หน้าเว็บ หากเก็บข้อมูลผ่านเครื่องผู้จัดทำทั้งหมด
- PDF ใช้ print stylesheet และ browser “Save as PDF” ก่อน ยังไม่เพิ่มบริการสร้าง PDF
- หากข้อมูลมีจำนวนมาก ให้จำกัดจำนวนหลักฐานที่แสดงต่อหน้าและขนาดข้อมูลที่ส่งให้ client โดยคงยอดสรุปจากข้อมูลที่ผ่านการตรวจครบชุด

## 8. Environment variables

```dotenv
BRIGHT_DATA_API_KEY=
BRIGHT_DATA_TIKTOK_SEARCH_DATASET_ID=gd_lu702nij2f790tmv9h
BRIGHT_DATA_TIKTOK_COMMENTS_DATASET_ID=
```

เติมเฉพาะ scraper ที่ใช้จริงสำหรับ TikTok ตรวจ dataset ID จากบัญชี Bright Data และไม่ใส่คีย์ในไฟล์รายงานหรือใช้ชื่อขึ้นต้น `NEXT_PUBLIC_` เพราะ Next.js เปิดเผยตัวแปร prefix นี้ให้ client ได้ ตาม [Next.js: Environment Variables](https://nextjs.org/docs/app/guides/environment-variables)

Next.js โหลด `.env.local` ให้ runtime ของแอป แต่ standalone Node scripts ต้องโหลด environment เอง เช่นส่ง environment จาก shell หรือใช้ตัวเลือกโหลด env ของ Node รุ่นที่รองรับ ไม่สมมติว่า scripts จะอ่านไฟล์นี้โดยอัตโนมัติ

เพิ่ม `work/` และไฟล์ env ที่มีค่าจริงลง `.gitignore` ข้อมูลใน `data/reports/` ต้องเป็นข้อมูลที่พร้อมเปิดเผยแล้ว และก่อน build รายงานจริงให้ validation ปฏิเสธ `isDemo: true`

## 9. ขอบเขตเวอร์ชันแรกและเกณฑ์พร้อมใช้งาน

เวอร์ชันแรกประกอบด้วยหน้ารวมรายงาน หน้ารายงาน หน้า evidence การนำเข้าข้อมูล JSON และการเก็บผ่าน Bright Data ตามรอบที่ผู้จัดทำสั่ง โดยรองรับ TikTok ก่อน ยังไม่รวม Instagram, Facebook, ระบบสมาชิก, หน้าจัดการ CMS หรือระบบตั้งเวลาอัตโนมัติ

ก่อนเผยแพร่ตรวจว่า:

- ยอดรวมกราฟรายวันและตารางแพลตฟอร์มตรงกับจำนวนรายการหลังตัดซ้ำ
- สูตรความรู้สึกใช้ฐานเดียวกันทั้งหน้า และแยกข้อมูลที่ยังไม่จัดประเภท
- ทุกข้อค้นพบอ้างถึง evidence ID ที่มีอยู่จริง และลิงก์ต้นทางใช้ได้
- ไม่มีข้อมูลสมมติหรือ secret ปะปนในรายงานจริง
- ค้นหา กรอง เปิดลิงก์หลักฐาน และพิมพ์รายงานได้ทั้งบน desktop และมือถือ
- `next build` ผ่าน และการเปิดหน้าเว็บไม่สร้างงาน Bright Data ใหม่

## 10. แหล่งอ้างอิง

- [Bright Data Social Media Scraper — แพลตฟอร์มและชนิดข้อมูลที่รองรับ](https://brightdata.com/products/web-scraper/social-media-scrape)
- [Bright Data Monitor Progress — การตรวจงานแบบ asynchronous](https://docs.brightdata.com/api-reference/web-scraper-api/management-apis/monitor-progress)
- [Bright Data API reference example — trigger และ snapshot](https://github.com/brightdata/skills/blob/main/skills/bright-data-best-practices/references/web-scraper-api.md)
- [Next.js Environment Variables](https://nextjs.org/docs/app/guides/environment-variables)

ตรวจเอกสารประกอบวันที่ 22 กันยายน 2569 โควตา ราคา และ schema ของ scraper ให้ตรวจจากบัญชีและเอกสารปัจจุบันตอนใช้งานจริง
