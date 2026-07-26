import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "栗子打卡",
  description: "记录微小行动，看见长期成长。每一次微小行动，都值得被记录。",
  applicationName: "栗子打卡",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "栗子打卡",
    description: "每一次微小行动，都值得被记录。",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "栗子打卡" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "栗子打卡",
    description: "每一次微小行动，都值得被记录。",
    images: ["/og.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "栗子打卡",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f1e7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
