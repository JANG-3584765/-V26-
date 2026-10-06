import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "카드 비교",
  description: "같은 조건에서 선수 카드 능력치를 비교하는 비공식 팬 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
