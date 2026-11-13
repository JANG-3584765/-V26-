import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { GA_ID } from "@/lib/analytics";
import "./globals.css";

const DESCRIPTION = "컴투스프로야구 V26 선수 카드를 같은 육성 조건에 놓고 최종 능력치를 1:1로 비교하는 비공식 팬 도구";

// 검색 결과와 링크 미리보기(카톡·커뮤니티)에 쓰이는 정보. https://nextjs.org/docs/app/api-reference/functions/generate-metadata
export const metadata: Metadata = {
  metadataBase: new URL("https://cpv-cardvs.vercel.app"),
  title: "카드 비교 | 같은 조건 선수 카드 능력치 비교",
  description: DESCRIPTION,
  openGraph: {
    title: "카드 비교",
    description: DESCRIPTION,
    url: "/",
    siteName: "카드 비교",
    locale: "ko_KR",
    type: "website",
  },
};

// 모바일 브라우저 주소창 색. https://nextjs.org/docs/app/api-reference/functions/generate-viewport
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
      {/* 측정 ID가 있을 때만 GA를 켠다. 페이지가 뜬 뒤에 스크립트를 받아 첫 화면을 늦추지 않는다.
          https://nextjs.org/docs/app/guides/third-party-libraries#google-analytics */}
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}
