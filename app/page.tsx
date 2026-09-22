import { redirect } from "next/navigation";

const featuredReportSlug = "iphone-18-selected-tiktok";

export default function HomePage() {
  redirect(`/reports/${featuredReportSlug}`);
}
