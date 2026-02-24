import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AlohaShift — Hawaii Commute Intelligence",
  description:
    "AlohaShift helps Hawaii commuters find the best departure time by visualizing real-time traffic predictions. Compare arrival times side by side and beat the rush.",
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
      "Find the best time to leave. Compare departure slots and see exactly when traffic hits hardest — built for Hawaii commuters.",
    type: "website",
    locale: "en_US",
    url: "https://alohashift.com",
    siteName: "AlohaShift",
  },
  twitter: {
    card: "summary_large_image",
    title: "AlohaShift — Hawaii Commute Intelligence",
    description:
      "Find the best time to leave. Compare departure slots and see exactly when traffic hits hardest — built for Hawaii commuters.",
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
      </body>
    </html>
  );
}
