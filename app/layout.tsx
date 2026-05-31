import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raga Playbook | Equity Sales & Advisory",
  description: "Professional equity sales and capital market advisory services",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
