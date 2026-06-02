import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import CreatorProfileClient from "./CreatorProfileClient";
import SchemaMarkup from "@/components/SEO/SchemaMarkup";
import JsonLd from "@/components/SEO/JsonLd";
import { generatePersonSchema, generateWebSiteSchema } from "@/lib/seo/personSchema";

// ISR configuration — revalidate every 60 seconds
export const revalidate = 60;

// Generate static params for popular creators (optional, improves performance)
export async function generateStaticParams() {
  // For initial build, we don't need to pre-generate all creator pages
  // This will be handled by ISR as users visit pages
  return [];
}

// Fetch creator data on server for ISR
async function getCreator(username: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  try {
    const res = await fetch(`${API_URL}/api/creators/${username}`, {
      next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.creator;
  } catch (error) {
    console.error("Failed to fetch creator:", error);
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const creator = await getCreator(username);

  if (!creator) {
    return {
      title: "Creator Not Found | STEEZE",
      description: "The requested creator profile could not be found.",
    };
  }

  const artistName = creator.artistName || creator.fullName;
  const description =
    creator.shortBio ||
    creator.fullBio?.substring(0, 160) ||
    `Listen to music from ${artistName} on STEEZE.`;
  const imageUrl =
    creator.profilePicUrl ||
    creator.coverPhotoUrl ||
    "/images/steeze-og.png";

  return {
    title: `${artistName} | STEEZE`,
    description: description,
    openGraph: {
      title: `${artistName} on STEEZE`,
      description: description,
      url: `https://steeze.com/creator/${username}`,
      siteName: "STEEZE",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: artistName,
        },
      ],
      locale: "en_ZA",
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${artistName} on STEEZE`,
      description: description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: `https://steeze.com/creator/${username}`,
    },
  };
}

// Server component page
export default async function CreatorPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const creator = await getCreator(username);

  if (!creator) {
    notFound();
  }

  // Prepare schema data for structured data
  const artistName = creator.artistName || creator.fullName;
  const profileUrl = `https://steeze.com/creator/${username}`;
  const imageUrl =
    creator.profilePicUrl ||
    creator.coverPhotoUrl ||
    "/images/steeze-og.png";

  // Social links for sameAs array
  const socialLinks: string[] = [];
  if (creator.socialLinks?.instagram) socialLinks.push(creator.socialLinks.instagram);
  if (creator.socialLinks?.tiktok) socialLinks.push(creator.socialLinks.tiktok);
  if (creator.socialLinks?.youtube) socialLinks.push(creator.socialLinks.youtube);
  if (creator.socialLinks?.spotify) socialLinks.push(creator.socialLinks.spotify);
  if (creator.socialLinks?.twitter) socialLinks.push(creator.socialLinks.twitter);

  const schemaDescription =
    creator.shortBio ||
    creator.fullBio?.substring(0, 200) ||
    `Listen to music from ${artistName} on STEEZE.`;

  const musicArtistSchema = {
    name: artistName,
    url: profileUrl,
    image: imageUrl,
    description: schemaDescription,
    sameAs: socialLinks,
    genre: creator.genre ? [creator.genre] : [],
    tracks: creator.songs?.map((song: Record<string, unknown>) => ({
      name: song.title,
      url: `${profileUrl}/song/${song.id}`,
      duration: song.duration,
    })),
    albums: creator.albums?.map((album: Record<string, unknown>) => ({
      name: album.title,
      url: `${profileUrl}/album/${album.id}`,
      image: album.coverArtUrl,
      datePublished: album.releaseDate,
    })),
  };

  const profilePageSchema = {
    name: `${artistName} - STEEZE Profile`,
    url: profileUrl,
    description: schemaDescription,
    entityName: artistName,
    entityId: creator.id,
    dateCreated: creator.createdAt,
    dateModified: creator.updatedAt,
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://steeze.com';
  const personSchema = generatePersonSchema(
    {
      artistName,
      email: creator.email || '',
      description: schemaDescription,
      profilePicUrl: imageUrl,
      userType: creator.userType || 'creator',
      followers: creator.followers,
      createdAt: creator.createdAt,
      socialLinks: creator.socialLinks,
    },
    baseUrl
  );
  const websiteSchema = generateWebSiteSchema(baseUrl);

  return (
    <>
      <JsonLd data={personSchema} />
      <JsonLd data={websiteSchema} />
      <SchemaMarkup type="MusicArtist" data={musicArtistSchema} />
      <SchemaMarkup type="ProfilePage" data={profilePageSchema} />
      <Suspense
        fallback={
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-gold animate-pulse">Loading...</div>
          </div>
        }
      >
        <CreatorProfileClient
          initialCreator={creator}
          username={username}
        />
      </Suspense>
    </>
  );
}