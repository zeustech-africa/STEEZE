"use client";

interface SchemaMarkupProps {
  type:
    | "MusicArtist"
    | "MusicAlbum"
    | "MusicRecording"
    | "Person"
    | "ProfilePage";
  data: Record<string, unknown>;
}

export default function SchemaMarkup({ type, data }: SchemaMarkupProps) {
  const getSchema = () => {
    switch (type) {
      case "MusicArtist":
        return {
          "@context": "https://schema.org",
          "@type": "MusicArtist",
          name: data.name,
          url: data.url,
          image: data.image,
          description: data.description,
          sameAs: data.sameAs || [],
          genre: data.genre || [],
          album:
            (data.albums as Array<Record<string, unknown>>)?.map(
              (album: Record<string, unknown>) => ({
                "@type": "MusicAlbum",
                name: album.name,
                url: album.url,
                image: album.image,
                datePublished: album.datePublished,
              })
            ),
          track:
            (data.tracks as Array<Record<string, unknown>>)?.map(
              (track: Record<string, unknown>) => ({
                "@type": "MusicRecording",
                name: track.name,
                url: track.url,
                duration: track.duration,
              })
            ),
        };

      case "MusicAlbum":
        return {
          "@context": "https://schema.org",
          "@type": "MusicAlbum",
          name: data.name,
          url: data.url,
          image: data.image,
          byArtist: {
            "@type": "MusicArtist",
            name: data.artistName,
            url: data.artistUrl,
          },
          datePublished: data.datePublished,
          numTracks: data.numTracks,
          track:
            (data.tracks as Array<Record<string, unknown>>)?.map(
              (track: Record<string, unknown>) => ({
                "@type": "MusicRecording",
                name: track.name,
                url: track.url,
                duration: track.duration,
              })
            ),
        };

      case "MusicRecording":
        return {
          "@context": "https://schema.org",
          "@type": "MusicRecording",
          name: data.name,
          url: data.url,
          duration: data.duration,
          byArtist: {
            "@type": "MusicArtist",
            name: data.artistName,
            url: data.artistUrl,
          },
          inAlbum: data.albumName
            ? {
                "@type": "MusicAlbum",
                name: data.albumName,
              }
            : undefined,
        };

      case "Person":
        return {
          "@context": "https://schema.org",
          "@type": "Person",
          name: data.name,
          url: data.url,
          image: data.image,
          description: data.description,
          sameAs: data.sameAs || [],
          jobTitle: data.jobTitle,
          worksFor: data.worksFor,
        };

      case "ProfilePage":
        return {
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          name: data.name,
          url: data.url,
          description: data.description,
          dateCreated: data.dateCreated,
          dateModified: data.dateModified,
          mainEntity: {
            "@type": "Person",
            name: data.entityName,
            identifier: data.entityId,
          },
        };

      default:
        return null;
    }
  };

  const schema = getSchema();
  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}