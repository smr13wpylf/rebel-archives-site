import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getAllPostMeta } from "@/lib/posts";

/**
 * Generated sitemap. Static routes plus every journal post.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/about",
    "/writing",
    "/work-with-me",
    "/offerings",
    "/subscribe",
    "/contact",
    "/now",
  ].map((path) => ({
    url: `${site.url}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const posts = getAllPostMeta().map((post) => ({
    url: `${site.url}/writing/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...routes, ...posts];
}
