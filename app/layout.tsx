import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { ThemeProvider } from "./ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  const origin = host ? `${protocol}://${host}` : "http://localhost:3000";
  const previewImage = `${origin}/og.png`;

  return {
    title: "Markdown Viewer — Instant GitHub-style preview",
    description:
      "Write, preview, and export Markdown instantly. Private, secure, and entirely in your browser.",
    applicationName: "Markdown Viewer",
    keywords: [
      "Markdown viewer",
      "Markdown preview",
      "README editor",
      "GitHub Flavored Markdown",
      "Markdown to HTML",
    ],
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      title: "Markdown Viewer",
      description: "Write. Preview. Ship. A private Markdown workspace.",
      siteName: "Markdown Viewer",
      images: [
        {
          url: previewImage,
          width: 1792,
          height: 928,
          alt: "Markdown Viewer editor and live preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Markdown Viewer",
      description: "Write. Preview. Ship. A private Markdown workspace.",
      images: [previewImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/katex.min.css" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
