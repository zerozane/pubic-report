import { redirect } from "next/navigation";

const featuredReportSlug = "laglace-clean-social-report";

export default function HomePage() {
  redirect(`/reports/${featuredReportSlug}`);
}
