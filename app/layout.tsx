import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://alohashift.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "AlohaShift — Hawaii Commute Intelligence",
  description:
    "Find the best time to leave for your Oahu commute. Compare departure slots side by side, see when traffic hits hardest, and arrive on time — built for Hawaii drivers.",
  keywords: [
    "Hawaii commute",
    "Honolulu traffic",
    "departure time planner",
    "commute intelligence",
    "beat traffic Hawaii",
    "H-1 freeway traffic",
    "Oahu commute tool",
    "traffic prediction Hawaii",
    "Congress App Challenge",
  ],
  authors: [{ name: "AlohaShift" }],
  openGraph: {
    title: "AlohaShift — Hawaii Commute Intelligence",
    description:
      "Find the best time to leave for your Oahu commute. Compare departure slots side by side and see exactly when traffic hits hardest.",
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "AlohaShift",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "AlohaShift — Hawaii Commute Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AlohaShift — Hawaii Commute Intelligence",
    description:
      "Find the best time to leave for your Oahu commute. Compare departure slots and see exactly when traffic hits hardest.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=en`}
          strategy="beforeInteractive"
        />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
