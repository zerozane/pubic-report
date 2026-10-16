# Shopee review pipeline

ใช้ `dami_studio/shopee-shop-reviews-scraper` ผ่าน Apify เพื่อดึงรีวิวจากร้าน Shopee แล้วแปลงเข้า schema เดียวกับหน้า Product Quality เดิม โดยแยกสินค้าให้จาก `itemid` และ `product_name` ในแต่ละรีวิว

โหมดเดิมของ URL สินค้ายังใช้งานได้ด้วยไฟล์ array เดิม หรือระบุ `--mode product`

## 1. เตรียมรายการสินค้า

คัดลอก `data/inputs/laglace-shopee-products.example.json` เป็น `data/inputs/laglace-shopee-products.json` แล้วแทน URL ตัวอย่างด้วย URL จริงที่มีรูปแบบ `-i.<shopId>.<itemId>`

```json
[
  {
    "name": "บลัชดำ",
    "label": "LA GLACE BAEBIE VIBES CREAM BLUSH",
    "category": "บลัช",
    "url": "https://shopee.co.th/product-i.123456789.987654321"
  }
]
```

## 2. ดึงรีวิวจากร้าน Official (แนะนำ)

ไฟล์ `data/inputs/laglace-shopee-shop.json` ใช้ร้าน Official ของ La Glace และ catalog สินค้าเป็นตัวช่วยจับหมวดหมู่

```bash
npm run apify:shopee:shop -- --max-reviews 100 --content-filter "with comments"
```

เริ่มที่ 100 รีวิวเพื่อเช็ค schema และ `coverage_note` ก่อน จากนั้นค่อยเพิ่มเป็น 300 หรือ 1,000 รีวิว

ตัวเลือกสำคัญ:

- `--max-reviews 100` ถึง `5000` จำนวนสูงสุดต่อร้าน; ไม่ควรเริ่มด้วยค่านี้จนกว่าจะตรวจผลทดสอบก่อน
- `--star-filter 1` ถึง `--star-filter 5` กรองระดับดาวก่อนเก็บ
- `--content-filter "with comments"` เก็บเฉพาะรีวิวที่มีข้อความ
- ถ้าใช้ URL สินค้าโดยตรง ให้ใช้ไฟล์ array เดิมและ `--mode product`; ผลลัพธ์จะไม่ใช่ประวัติสินค้าครบทั้งหมดของ Actor ใหม่

Actor ใหม่จะคืนทั้งแถวรีวิวและแถวสรุปร้าน (`type: "shop"`) สคริปต์ Normalize จะตัดแถวสรุปร้านออกโดยอัตโนมัติ

ถ้าต้องการทดลอง Dami ทีละสินค้า ให้ใช้คำสั่งแยกต่อ URL:

```bash
npm run apify:shopee:dami:blush
npm run apify:shopee:dami:lip
```

แต่ URL สินค้าใน Actor ใหม่ยังเป็นการกรองจาก shop sweep จึงต้องตรวจจำนวนและ `product_name` ใน raw ก่อนนำไปสรุปเป็นรายสินค้า

## 3. ดึงรีวิวจากสินค้าแบบเดิม

ต้องมี `APIFY_API_TOKEN` ใน `.env` ก่อนรัน

```bash
npm run apify:shopee -- --input data/inputs/laglace-shopee-products.json --output work/raw/laglace-shopee-reviews.json --max-reviews 1000
```

สำหรับบัญชีแรกที่แบ่งไว้ 2 สินค้า ใช้คำสั่งนี้ จะขอสินค้าละ 300 รีวิว รวมสูงสุดประมาณ 600 รีวิว เพื่อเหลืองบสำรอง:

```bash
npm run apify:shopee:products:first
```

โหมดสินค้าใช้ `zen-studio/shopee-product-reviews-scraper` เพราะต้องการจำนวนแยกต่อสินค้า ส่วนโหมดร้านใช้ Actor ใหม่ด้านบนเพื่อกวาดทั้งร้าน

ตัวเลือกที่ใช้ได้:

- `--full-history` ดึงประวัติที่เข้าถึงได้ทั้งหมดสำหรับ Actor สินค้าเดิม
- `--star-filter 1` ถึง `--star-filter 5` กรองดาวก่อนเก็บ
- `--content-filter "with comments"` หรือ `with media` หรือ `local`

## 4. Normalize เข้า Product Quality

```bash
npm run quality:normalize:shopee
```

สำหรับไฟล์ร้านใหม่ ใช้คำสั่งสั้น ๆ นี้:

```bash
npm run quality:normalize:shopee:shop
```

ผลลัพธ์จะอยู่ที่ `work/reviewed/laglace-shopee-product-reviews-normalized.json` และ `data/reports/laglace-shopee-product-quality.json`

กติกา sentiment ใช้ร่วมกับข้อมูลเดิม: 5 ดาวเป็นเชิงบวก, 3–4 ดาวเป็นเชิงกลาง และ 1–2 ดาวเป็นเชิงลบ ส่วน `qualityIssues` ยังต้องมีสัญญาณจากข้อความ ไม่ตัดสินจากคะแนนดาวอย่างเดียว

## ค่าใช้จ่าย

Actor ใหม่คิดประมาณ `$3.79 / 1,000 รีวิว` บนแผน FREE ตามเอกสารที่แนบ: 100 รีวิวประมาณ `$0.38`, 300 รีวิวประมาณ `$1.14`, 1,000 รีวิวประมาณ `$3.79` ราคาจริงควรตรวจในหน้า Pricing ก่อนกดรันแบบเต็มประวัติ
