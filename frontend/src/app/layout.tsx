import type { Metadata } from "next";
import "./globals.css";
import { BottomNavigation } from "@/components/ui/BottomNavigation/BottomNavigation";

export const metadata: Metadata = {
  title: "2026 관광데이터 활용 공모전",
  description: "참여형 자연 힐링 지도 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
      </head>
      <body>
        <div style={{ paddingBottom: '88px' }}> {/* 네비바 크기 확대(76px)에 맞춰 본문 하단 여백 확대 */}
          {children}
        </div>
        <BottomNavigation />
      </body>
    </html>
  );
}
