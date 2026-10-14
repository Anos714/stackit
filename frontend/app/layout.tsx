import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import "./globals.css";

const SITE_URL = "https://stackitcli.vercel.app";
const SITE_NAME = "stackit";
const TAGLINE = "Scaffold full-stack apps in one command — MERN, PERN, Hono + Postgres, Go + Fiber.";

const display = Space_Grotesk({
  variable: "--f-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Inter({
  variable: "--f-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  variable: "--f-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "stackit — scaffold full-stack apps in one command",
    template: "%s — stackit",
  },
  description:
    "Opinionated full-stack scaffolder. MERN, PERN, React + Hono + Postgres, Go + Fiber — best-practice monorepos with validation, Docker and docs.",
  keywords: [
    "scaffolder",
    "mern",
    "pern",
    "hono",
    "go fiber",
    "cli",
    "bun",
    "vite",
    "full-stack",
    "project generator",
    "create-stackit-app",
  ],
  authors: [{ name: "stackit" }],
  creator: "stackit",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "stackit — scaffold full-stack apps in one command",
    description: TAGLINE,
    url: SITE_URL,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "stackit" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "stackit — scaffold full-stack apps in one command",
    description: TAGLINE,
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "stackit",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  description: TAGLINE,
  url: SITE_URL,
  offers: { "@type": "Offer", price: "0" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${display.variable} ${sans.variable} ${mono.variable} bg-[#09090b] text-zinc-100`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
