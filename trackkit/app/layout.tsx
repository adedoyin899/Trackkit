import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Providers } from "./providers";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { UpdateBanner } from "@/components/UpdateBanner";
import "./globals.css";

const displayFont = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const interFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trackkit — Smart Market Inventory & Margins",
  description:
    "Offline-first inventory and margin tracker for market traders — know your numbers and profit, no internet required.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#ff4f40",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${interFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[var(--surface-canvas)] text-[var(--text-heading)] transition-colors duration-200">
        <UpdateBanner />
        <OfflineIndicator />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
