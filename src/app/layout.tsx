import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getAppBaseUrl } from "@/lib/utils/url";
import { ThemeProvider } from "@/components/theme-provider";
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
  metadataBase: new URL(getAppBaseUrl()),
  title: {
    default: "Reportly | Automated Marketing Client Reporting",
    template: "%s | Reportly",
  },
  description:
    "Reportly is the premier client reporting platform for marketing agencies. Automatically sync Google Ads, Meta Ads, and GA4 metrics into white-labeled client performance reports.",
  keywords: [
    "marketing reporting software",
    "agency client reporting",
    "automated marketing reports",
    "Google Ads reporting dashboard",
    "Meta Ads performance report",
    "GA4 client portal",
    "white label agency software",
  ],
  authors: [{ name: "Reportly Team" }],
  creator: "Reportly",
  publisher: "Reportly",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icon.svg" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: getAppBaseUrl(),
    siteName: "Reportly",
    title: "Reportly | Automated Marketing Client Reporting",
    description:
      "Automate multi-channel client performance reporting for your agency. Connect Google Ads, Meta Ads, and GA4 in minutes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Reportly Marketing Client Reporting Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reportly | Automated Marketing Client Reporting",
    description:
      "Automate multi-channel client performance reporting for your agency.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
