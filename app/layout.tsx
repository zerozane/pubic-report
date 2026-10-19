import type { Metadata } from "next";
import { Noto_Sans_Thai, Plus_Jakarta_Sans, Prompt } from "next/font/google";
import "./globals.css";

// Self-hosted at build time (no runtime request to Google). Exposed as CSS variables
// consumed by the font tokens in globals.css (--font-display-soft, --font-thai-ui, --font-body).
const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-prompt",
  display: "swap"
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  variable: "--font-noto-thai",
  display: "swap"
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap"
});

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
    <html lang="th" className={`${prompt.variable} ${notoSansThai.variable} ${plusJakartaSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
