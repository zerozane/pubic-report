"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { ProductQualityProduct } from "@/lib/productQuality";

const productImageUrls: Record<string, string> = {
  "1729588326432082832": "/products/laglace/1729588326432082832.jpg",
  "1730014506458516368": "/products/laglace/1730014506458516368.jpg",
  "1731510000560081808": "/products/laglace/1731510000560081808.jpg",
  "1729432254714448784": "/products/laglace/1729432254714448784.png",
  "1729605074994695056": "/products/laglace/1729605074994695056.jpg",
  "1729605073949133712": "/products/laglace/1729605073949133712.jpg",
  "1735378019447768976": "/products/laglace/1735378019447768976.jpg",
  "1731970787293235088": "/products/laglace/1731970787293235088.png",
  "1731525575167608720": "/products/laglace/1731525575167608720.png",
  "1731191277169969040": "/products/laglace/1731191277169969040.jpg",
  "1732072766553361296": "/products/laglace/1732072766553361296.jpg",
  "1734436642184595344": "/products/laglace/1734436642184595344.png"
};

export default function ProductQualityComparison({ products }: { products: ProductQualityProduct[] }) {
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => counts.set(product.category, (counts.get(product.category) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0], "th"));
  }, [products]);
  const filteredProducts = category === "all" ? products : products.filter((product) => product.category === category);

  return (
    <div className="lg-quality-comparison">
      <div className="lg-quality-category-filter" aria-label="กรองหมวดหมู่สินค้า">
        <label className="lg-quality-category-label" htmlFor="quality-category-filter">หมวดสินค้า</label>
        <select id="quality-category-filter" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">ทุกหมวด ({products.length})</option>
          {categories.map(([value, count]) => <option key={value} value={value}>{value} ({count})</option>)}
        </select>
      </div>
      <p className="lg-quality-filter-result">แสดง {filteredProducts.length} จาก {products.length} สินค้า</p>
      <div className="lg-quality-product-grid">
        {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: ProductQualityProduct }) {
  const imageUrl = productImageUrls[product.id];

  return (
    <article className="lg-quality-product-card">
      <div className="lg-quality-product-card-head">
        <div>
          <span>{product.category}</span>
          <h3>{product.sourceName}</h3>
          <small className="lg-quality-product-label">{product.label}</small>
        </div>
        <div className="lg-quality-product-image" aria-label={`รูปสินค้า ${product.sourceName}`}>
          {imageUrl ? <Image src={imageUrl} alt={`ภาพสินค้า ${product.sourceName}`} width={144} height={144} /> : <span>{product.category.slice(0, 1)}</span>}
        </div>
      </div>
      <div className="lg-quality-product-summary">
        <div className="lg-quality-average-rating">
          <strong>{product.averageRating != null ? `${product.averageRating.toFixed(2)} ดาว` : "ไม่มีข้อมูล"}</strong>
          <span>จากคะแนนเต็ม 5 ดาว</span>
        </div>
        <small>คะแนนเฉลี่ยจาก {formatNumber(product.count)} รีวิว</small>
      </div>
      <small>คะแนน 1–2 ดาว {product.lowRatingPercent}% · สัญญาณต้องตรวจ {product.issueCount}</small>
      <div className="lg-quality-card-topics">
        {product.topics.slice(0, 3).map((topic) => <span key={topic.name}>{topic.name} {topic.count}</span>)}
      </div>
      <a className="lg-quality-product-link" href={`https://www.tiktok.com/shop/th/pdp/${product.id}`} target="_blank" rel="noreferrer">
        ดูหน้าสินค้าต้นทาง ↗
      </a>
    </article>
  );
}

function formatNumber(value: number) { return value.toLocaleString("th-TH"); }
