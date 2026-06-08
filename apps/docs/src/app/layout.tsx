import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import { Analytics } from "@vercel/analytics/next";
import { Banner } from "fumadocs-ui/components/banner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Regtrace",
    template: "%s | Regtrace",
  },
  description: "LLM evaluation and benchmarking tool",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  manifest: "/site.webmanifest",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Banner id="agent-skills" variant="rainbow">
          Agent Skills are now supported for Regtrace!
        </Banner>
        <RootProvider
          theme={{
            defaultTheme: "light",
          }}
        >
          {children}
          <Analytics />
        </RootProvider>
      </body>
    </html>
  );
}
