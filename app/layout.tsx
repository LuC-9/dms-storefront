import type { Metadata } from "next";
import { IBM_Plex_Mono, Oswald, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppChrome } from "@/components/layout/app-chrome";

const displayFont = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Delta Mill Stores",
  description: "Industrial hardware catalogue by Delta Mill Stores, Kanpur.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}
    >
      <body className="font-sans antialiased">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
