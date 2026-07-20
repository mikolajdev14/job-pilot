import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "JobPilot | Find jobs that fit",
  description:
    "Find relevant jobs, understand your match, and research companies before you apply.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <a
          href="#main-content"
          className="sr-only fixed start-4 top-4 z-50 rounded-md bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground focus:not-sr-only"
        >
          Skip to main content
        </a>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
