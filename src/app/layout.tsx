import type { Metadata } from "next";
import {
  IBM_Plex_Mono,
  Nunito,
  Fraunces,
} from "next/font/google";
import "./globals.css";
import TopNav from "@/components/top-nav";
import Link from "next/link";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Palabrero",
  description:
    "Local-first Spanish practice with corrections, analytics, and flashcards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${nunito.variable} ${plexMono.variable} ${fraunces.variable} antialiased relative`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-[rgb(var(--accent))] focus:px-6 focus:py-3 focus:text-white focus:shadow-lg"
        >
          Skip to content
        </a>
        
        {/* Organic Background Blobs */}
        <div className="pointer-events-none fixed top-0 left-0 w-96 h-96 bg-[rgb(var(--accent-soft))] rounded-full mix-blend-multiply filter blur-3xl opacity-70 -z-10 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="pointer-events-none fixed bottom-0 right-0 w-[500px] h-[500px] bg-[rgb(var(--accent-warm))] rounded-full mix-blend-multiply filter blur-3xl opacity-70 -z-10 translate-x-1/3 translate-y-1/3"></div>

        <div className="min-h-screen flex flex-col">
          <header className="pt-8 pb-4 px-6 relative z-10">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 rounded-full bg-white/50 backdrop-blur-md px-8 py-4 shadow-[0_4px_20px_-10px_rgba(214,125,107,0.1)]">
              <Link href="/" className="font-[family-name:var(--font-fraunces)] text-2xl font-bold text-[rgb(var(--ink))]">
                palabrero<span className="text-[rgb(var(--accent))]">.</span>
              </Link>
              <TopNav />
            </div>
          </header>
          <main id="main-content" className="mx-auto w-full max-w-6xl px-6 py-8 flex-1">
            {children}
          </main>
          <footer className="mx-auto w-full max-w-6xl px-6 pb-10 text-sm text-[rgb(var(--muted))] mt-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <span>Local-first. No accounts. Your data stays on-device.</span>
              <span>🌿 Organic UI Concept</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
