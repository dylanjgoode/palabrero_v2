import type { Metadata } from "next";
import {
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Source_Serif_4,
} from "next/font/google";
import "./globals.css";
import TopNav from "@/components/top-nav";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" className="scroll-smooth">
      <body
        className={`${plexSans.variable} ${plexMono.variable} ${sourceSerif.variable} antialiased`}
      >
        <div className="min-h-screen">
          <header className="border-b border-black/10 bg-white/60 backdrop-blur">
            <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[rgb(var(--accent))]">
                  Palabrero
                </p>
                <p className="text-sm text-[rgb(var(--muted))]">
                  Conversation-first Spanish practice with serious feedback.
                </p>
              </div>
              <TopNav />
            </div>
          </header>
          <main className="mx-auto w-full max-w-5xl px-6 py-12">
            {children}
          </main>
          <footer className="mx-auto w-full max-w-5xl px-6 pb-10 text-xs text-[rgb(var(--muted))]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-6">
              <span>Local-first. No accounts. Your data stays on-device.</span>
              <span>Build: early handoff scaffold</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
