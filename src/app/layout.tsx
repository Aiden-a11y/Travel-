import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travel Planner",
  description: "Plan your perfect trip, Apple-style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-[#0a0a0a] text-[#f5f5f7]">
        {children}
      </body>
    </html>
  );
}
