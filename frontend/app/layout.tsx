import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
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
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[#09090b] text-zinc-100`}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
