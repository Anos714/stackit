import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import "./globals.css";

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
  title: "stackit — scaffold full-stack apps in one command",
  description:
    "Opinionated full-stack scaffolder. MERN, PERN, React + Hono + Postgres, Go + Fiber — best-practice monorepos with validation, Docker and docs.",
  keywords: ["scaffolder", "mern", "pern", "hono", "go fiber", "cli", "bun", "vite", "full-stack"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${display.variable} ${sans.variable} ${mono.variable} bg-[#09090b] text-zinc-100`}
      >
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
