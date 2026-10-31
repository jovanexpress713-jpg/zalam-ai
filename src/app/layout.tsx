import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZALAM AI",
  description: "Open-source AI workspace and isolated cybersecurity research lab"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
