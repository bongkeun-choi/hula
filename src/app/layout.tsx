import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "온라인 보이스 훌라 (Hoola) - 실시간 음성 카드게임",
  description: "한국 정통 훌라 카드 게임을 여러 사람과 실시간 음성 채팅을 하며 즐기는 모바일 웹 게임",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full bg-slate-950 text-white antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 select-none touch-manipulation">
        {children}
      </body>
    </html>
  );
}
