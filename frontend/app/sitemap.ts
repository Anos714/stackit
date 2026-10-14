import type { MetadataRoute } from "next";

const SITE = "https://stackitcli.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/docs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];
}
