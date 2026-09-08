import type { Metadata } from "next";

// Canonicals describe the public site, never a request host or preview URL.
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://mdf-viewer.vercel.app",
).origin;
export const CONTENT_UPDATED = "2026-09-08";
export const SOURCE_URL = "https://github.com/sonal017/MDF-Viewer";

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).href;
}

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      type: "website", title, description, url: absoluteUrl(path), siteName: "MDF Viewer",
      images: [{ url: absoluteUrl("/og.png"), width: 1792, height: 928,
        alt: "Markdown Viewer editor and live preview" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [absoluteUrl("/og.png")] },
  };
}
