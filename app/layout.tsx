import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PUBLIC / NOTE — รายงานเสียงตอบรับบน TikTok",
  description: "สำรวจเสียงตอบรับ ประเด็นสำคัญ และความคิดเห็นต้นทางบน TikTok"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
