import { MetadataRoute } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Base URLs for static pages
const staticPages = [
  "",
  "/about",
  "/features",
  "/contact",
  "/privacy",
  "/terms",
  "/cookies",
  "/dmca",
  "/guidelines",
  "/help",
  "/security",
  "/brand",
  "/careers",
  "/blog",
  "/download/android",
  "/download/ios",
  "/download/mac",
  "/explore",
  "/search",
  "/notifications",
  "/inbox",
  "/settings",
  "/playlists",
];

// Fetch all creators for sitemap
async function getAllCreators() {
  try {
    const response = await fetch(`${API_URL}/api/creators/all?limit=10000`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.creators || [];
  } catch (error) {
    console.error("Failed to fetch creators for sitemap:", error);
    return [];
  }
}

// Fetch all popular posts for sitemap
async function getAllPosts() {
  try {
    const response = await fetch(`${API_URL}/api/posts/popular?limit=5000`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error("Failed to fetch posts for sitemap:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [creators, posts] = await Promise.all([
    getAllCreators(),
    getAllPosts(),
  ]);

  // Static pages with high priority
  const staticEntries = staticPages.map((page) => ({
    url: `https://steeze.com${page}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: page === "" ? 1.0 : 0.8,
  }));

  // Creator profile pages (ISR - revalidated)
  const creatorEntries = creators.map((creator: any) => ({
    url: `https://steeze.com/creator/${creator.username || creator.artistName?.toLowerCase().replace(/\s/g, "")}`,
    lastModified: new Date(creator.updatedAt || creator.createdAt),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  // Post pages (songs, videos)
  const postEntries = posts.map((post: any) => ({
    url: `https://steeze.com/post/${post.id}`,
    lastModified: new Date(post.updatedAt || post.createdAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...creatorEntries, ...postEntries];
}