"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  FileText,
  Layers,
  MessageSquare,
  Search,
  Video,
} from "lucide-react";
import type { Platform, ReportEvidence } from "@/lib/types";

type PlatformFilter = "all" | "issues" | Platform;
type RecordFilter = "all" | "post" | "comment";

const platformLabels: Record<string, string> = {
  TikTok: "TikTok",
  X: "X",
  Instagram: "Instagram",
  Facebook: "Facebook",
  YouTube: "YouTube"
};

const sentimentLabels: Record<string, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative"
};

export default function MentionsExplorer({ evidence }: { evidence: ReportEvidence[] }) {
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [recordType, setRecordType] = useState<RecordFilter>("all");
  const [keyword, setKeyword] = useState("all");
  const [query, setQuery] = useState("");

  const records = useMemo(() => evidence, [evidence]);
  const posts = useMemo(() => records.filter((item) => item.recordType === "post"), [records]);
  const comments = useMemo(() => records.filter((item) => item.recordType === "comment"), [records]);

  const postLookup = useMemo(() => {
    const lookup = new Map<string, ReportEvidence>();
    for (const item of posts) {
      lookup.set(item.id, item);
      if (item.sourceId) lookup.set(item.sourceId, item);
    }
    return lookup;
  }, [posts]);

  const keywords = useMemo(
    () => Array.from(new Set(records.flatMap((item) => item.matchedKeywords || item.topics || []))).sort((a, b) => a.localeCompare(b, "th")),
    [records]
  );

  const platforms = useMemo(
    () => Array.from(new Set(records.map((item) => item.platform))),
    [records]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("th");

    return records.filter((item) => {
      if (platform === "issues" && !item.isIssue) return false;
      if (platform !== "all" && platform !== "issues" && item.platform !== platform) return false;
      if (recordType !== "all" && item.recordType !== recordType) return false;

      const itemKeywords = item.matchedKeywords || item.topics || [];
      if (keyword !== "all" && !itemKeywords.some((value) => value.toLocaleLowerCase("th").includes(keyword.toLocaleLowerCase("th")))) {
        return false;
      }

      if (!needle) return true;
      return [
        item.text,
        item.user,
        item.authorName,
        item.intent,
        item.detail,
        item.recordType,
        ...itemKeywords
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("th")
        .includes(needle);
    });
  }, [records, platform, recordType, keyword, query]);

  return (
    <section className="lg-section" id="stream">
      <div className="lg-section-head">
        <div>
          <h2>
            <FileText size={20} />
            เสียงผู้บริโภค
          </h2>
          <p>ค้นหาและตรวจสอบโพสต์หรือคอมเมนต์จริง โดยดูสินค้า ประเด็นคุณภาพ sentiment แพลตฟอร์ม และลิงก์ต้นทางได้ในจุดเดียว</p>
        </div>
        <span className="lg-result-count">
          Showing {filtered.length.toLocaleString("th-TH")} of {records.length.toLocaleString("th-TH")} records
        </span>
      </div>

      <div className="lg-glass lg-filter-panel">
        <div className="lg-search-row">
          <label className="lg-search-box">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาข้อความ สินค้า ประเด็น หรือ keyword..."
            />
          </label>

          <select value={keyword} onChange={(event) => setKeyword(event.target.value)}>
            <option value="all">ทุกประเด็น / keyword</option>
            {keywords.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="lg-platform-filters">
          <span>Record type:</span>
          <button className={recordType === "all" ? "active" : ""} onClick={() => setRecordType("all")} type="button">
            <Layers size={14} />
            All
          </button>
          <button className={recordType === "post" ? "active" : ""} onClick={() => setRecordType("post")} type="button">
            <Video size={14} />
            Posts {posts.length.toLocaleString("th-TH")}
          </button>
          <button className={recordType === "comment" ? "active" : ""} onClick={() => setRecordType("comment")} type="button">
            <MessageSquare size={14} />
            Comments {comments.length.toLocaleString("th-TH")}
          </button>
        </div>

        <div className="lg-platform-filters">
          <span>Platform:</span>
          <button className={platform === "all" ? "active" : ""} onClick={() => setPlatform("all")} type="button">
            All
          </button>
          {platforms.map((value) => (
            <button
              className={platform === value ? "active" : ""}
              key={value}
              onClick={() => setPlatform(value)}
              type="button"
            >
              {platformLabels[value] || value}
            </button>
          ))}
          <button className={platform === "issues" ? "active" : ""} onClick={() => setPlatform("issues")} type="button">
            <AlertTriangle size={14} />
            Flagged
          </button>
        </div>
      </div>

      <div className="lg-table-wrap">
        <table className="lg-data-table">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Author</th>
              <th>Mention</th>
              <th>Keywords / Topics</th>
              <th>Type / Sentiment</th>
              <th>Engagement</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const source = getPostSource(item, postLookup);
              return (
                <tr key={item.id}>
                  <td>
                    <span className={`lg-badge lg-platform lg-platform-${platformClass(item.platform)}`}>
                      {platformLabels[item.platform] || item.platform}
                    </span>
                    <small>{item.recordType === "post" ? "Post" : "Comment"}</small>
                  </td>
                  <td>
                    <strong>{item.user || item.authorName || "-"}</strong>
                    <small>{formatDate(item.publishedAt)}</small>
                  </td>
                  <td>
                    <p className="lg-mention-text">{item.text}</p>
                    <small>{item.recordType === "post" ? "Post / video record" : item.authorName}</small>
                  </td>
                  <td>
                    <div className="lg-keyword-list">
                      {(item.matchedKeywords || item.topics || []).slice(0, 4).map((value) => (
                        <span key={value}>{value}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`lg-badge lg-sentiment-${item.sentiment || "neutral"}`}>
                      {item.recordType === "post" ? "Post" : sentimentLabels[item.sentiment || "neutral"]}
                    </span>
                    {item.isIssue ? <small className="lg-issue">Issue flagged</small> : null}
                  </td>
                  <td>
                    <strong>{formatCompact(item.engagement ?? item.metrics.likes ?? item.metrics.views ?? 0)}</strong>
                    {item.recordType === "post" && item.metrics.views ? <small>{formatCompact(item.metrics.views)} views</small> : null}
                  </td>
                  <td>
                    <div className="lg-row-actions">
                      {source.url ? (
                        <a className="lg-post-link" href={source.url} target="_blank" rel="noreferrer" aria-label="Open source post">
                          <ExternalLink size={14} />
                          {source.label}
                        </a>
                      ) : (
                        <small className="lg-source-missing">{source.reason}</small>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getPostSource(item: ReportEvidence, postLookup: Map<string, ReportEvidence>) {
  const parentPost = item.parentPostId ? postLookup.get(item.parentPostId) : null;
  const parentUrl = parentPost?.sourceUrl ? normalizeSourceUrl(parentPost.sourceUrl, item.platform) : null;
  if (parentUrl) return { url: parentUrl, label: "Open post", reason: "" };

  const parentIdUrl = normalizeSourceUrl(item.parentPostId, item.platform);
  if (parentIdUrl) return { url: parentIdUrl, label: "Open post", reason: "" };

  const ownUrl = normalizeSourceUrl(item.sourceUrl, item.platform);
  if (ownUrl) {
    return {
      url: ownUrl,
      label: item.recordType === "comment" ? "Open thread" : "Open post",
      reason: ""
    };
  }

  return {
    url: null,
    label: "",
    reason: getMissingSourceReason(item)
  };
}

function getMissingSourceReason(item: ReportEvidence) {
  if (!item.sourceUrl) return "No source URL";
  if (!/^https?:\/\//i.test(item.sourceUrl)) return "Invalid URL";

  try {
    const url = new URL(item.sourceUrl);
    if (!isPlatformUrl(url, item.platform)) return "Wrong platform URL";
    if (!isPostLikeUrl(url, item.platform)) return "Not a post URL";
  } catch {
    return "Invalid URL";
  }

  return "No usable source URL";
}

function normalizeSourceUrl(value: string | null | undefined, platform: Platform) {
  if (!value || !/^https?:\/\//i.test(value)) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (!isPlatformUrl(url, platform)) return null;
  if (!isPostLikeUrl(url, platform)) return null;

  url.hash = "";
  url.searchParams.delete("comment_id");
  url.searchParams.delete("reply_comment_id");
  url.searchParams.delete("commentId");
  url.searchParams.delete("fb_comment_id");
  return url.toString();
}

function isPostLikeUrl(url: URL, platform: Platform) {
  const path = url.pathname.toLowerCase();
  if (platform === "TikTok") return /\/video\/\d+/.test(path);
  if (platform === "Instagram") return /^\/(p|reel|tv)\//.test(path);
  if (platform === "Facebook") return path.includes("/posts/") || path.includes("/videos/") || path.includes("/photo") || path.includes("/permalink.php") || (path === "/video.php" && Boolean(url.searchParams.get("v")));
  if (platform === "YouTube") return (path === "/watch" && Boolean(url.searchParams.get("v"))) || path.startsWith("/shorts/");
  if (platform === "X") return path.includes("/status/");
  return true;
}

function isPlatformUrl(url: URL, platform: Platform) {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (platform === "TikTok") return host === "tiktok.com" || host.endsWith(".tiktok.com");
  if (platform === "Instagram") return host === "instagram.com" || host.endsWith(".instagram.com");
  if (platform === "Facebook") return host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.watch";
  if (platform === "YouTube") return host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be";
  if (platform === "X") return host === "x.com" || host.endsWith(".x.com") || host === "twitter.com" || host.endsWith(".twitter.com");
  return false;
}

function platformClass(platform: string) {
  return platform.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function formatCompact(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString("th-TH");
}

function formatDate(value: string) {
  if (!value || Number.isNaN(Date.parse(value))) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Bangkok"
  }).format(new Date(value));
}
