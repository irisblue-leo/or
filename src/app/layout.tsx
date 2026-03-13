import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenClaw Relay - API Token 中转平台",
  description: "OpenClaw 生态 API 中转服务，一站式接入多家 LLM 提供商",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
