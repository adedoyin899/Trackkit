import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { UpdateBanner } from "@/components/UpdateBanner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trackkit",
  description:
    "Offline-first inventory tracker for market traders — know your stock, no internet required.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
  // No maximumScale cap: blocking pinch-zoom fails accessibility audits and
  // actively hurts a target audience that may need to zoom to read small
  // text — the opposite of this app's "large, high-contrast" UI goal.
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream-canvas">
        <UpdateBanner />
        <OfflineIndicator />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
