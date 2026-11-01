import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Sancreek is self-hosted from the .ttf we ship in /public/fonts.
// Exposed as a CSS variable so both Tailwind and plain CSS can use it.
const sancreek = localFont({
  src: "../public/fonts/Sancreek-Regular.ttf",
  variable: "--font-sancreek",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dev Tony",
  description: "An ink-and-paper 3D portfolio",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sancreek.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
