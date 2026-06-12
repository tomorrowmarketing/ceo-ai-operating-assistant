import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "대표님 운영 비서 | 일일 운영 브리핑",
  description:
    "리드수집 광고대행사 대표를 위한 개인용 AI 운영 비서. 매일 오전 5분 안에 회사 운영 상황을 파악합니다.",
};

/** 대표가 폰으로 아침에 확인하는 시나리오 대비, 모바일 뷰포트 명시 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f5f7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
