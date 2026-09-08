import type { MetadataRoute } from "next";
import { absoluteUrl, CONTENT_UPDATED } from "./lib/seo";
import { guides } from "./lib/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...["/", "/guides", "/about"].map((path) => ({
      url: absoluteUrl(path), lastModified: CONTENT_UPDATED,
    })),
    ...guides.map((guide) => ({
      url: absoluteUrl(`/guides/${guide.slug}`), lastModified: guide.updated,
    })),
  ];
}
