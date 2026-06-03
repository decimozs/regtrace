import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Regtrace — LLM Evaluation CLI",
  description:
    "A linter for your LLM outputs. Evaluate factuality, format, tone, and regression. Detect quality degradation before your users notice.",
  openGraph: {
    title: "Regtrace — LLM Evaluation CLI",
    description:
      "A linter for your LLM outputs. Evaluate factuality, format, tone, and regression. Detect quality degradation before your users notice.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        {children}
        {/* impeccable-live-start */}
        <script src="http://localhost:8400/live.js"></script>
        {/* impeccable-live-end */}
      </body>
    </html>
  );
}
