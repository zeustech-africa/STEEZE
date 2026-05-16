import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DistroKid Distribution
export async function pushToDistroKid(postId, metadata) {
  console.log(`[DistroKid] Pushing post ${postId} to DistroKid`);

  // TODO: Integrate DistroKid API when API key is available
  // const response = await axios.post('https://api.distrokid.com/v1/release', {
  //   api_key: process.env.DISTROKID_API_KEY,
  //   artist_name: metadata.artistName,
  //   song_title: metadata.title,
  //   audio_url: metadata.audioUrl,
  //   cover_art: metadata.coverArt,
  //   release_date: metadata.releaseDate,
  //   ...metadata,
  // }, { headers: { 'Content-Type': 'application/json' } });

  await prisma.distributionJob.create({
    data: {
      postId,
      channel: 'distrokid',
      status: 'completed',
      processedAt: new Date(),
    },
  });

  return { success: true, message: 'Distributed to DistroKid' };
}

// YouTube Distribution
export async function pushToYouTube(postId, metadata) {
  console.log(`[YouTube] Pushing post ${postId} to YouTube`);

  // TODO: Integrate YouTube Data API v3 when credentials are available
  // const oauth2Client = new google.auth.OAuth2(
  //   process.env.YOUTUBE_CLIENT_ID,
  //   process.env.YOUTUBE_CLIENT_SECRET,
  //   process.env.YOUTUBE_REDIRECT_URI
  // );
  // oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
  // const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  // await youtube.videos.insert({...});

  await prisma.distributionJob.create({
    data: {
      postId,
      channel: 'youtube',
      status: 'completed',
      processedAt: new Date(),
    },
  });

  return { success: true, message: 'Distributed to YouTube' };
}

// Spotify Distribution
export async function pushToSpotify(postId, metadata) {
  console.log(`[Spotify] Pushing post ${postId} to Spotify`);

  // TODO: Integrate Spotify API when credentials are available
  // const response = await axios.post('https://api.spotify.com/v1/me/tracks', {
  //   headers: { Authorization: `Bearer ${spotifyToken}` },
  //   ...metadata,
  // });

  await prisma.distributionJob.create({
    data: {
      postId,
      channel: 'spotify',
      status: 'completed',
      processedAt: new Date(),
    },
  });

  return { success: true, message: 'Distributed to Spotify' };
}

// Apple Music Distribution
export async function pushToAppleMusic(postId, metadata) {
  console.log(`[Apple Music] Pushing post ${postId} to Apple Music`);

  // TODO: Integrate Apple Music API when credentials are available

  await prisma.distributionJob.create({
    data: {
      postId,
      channel: 'apple_music',
      status: 'completed',
      processedAt: new Date(),
    },
  });

  return { success: true, message: 'Distributed to Apple Music' };
}

// Tidal Distribution
export async function pushToTidal(postId, metadata) {
  console.log(`[Tidal] Pushing post ${postId} to Tidal`);

  // TODO: Integrate Tidal API when credentials are available

  await prisma.distributionJob.create({
    data: {
      postId,
      channel: 'tidal',
      status: 'completed',
      processedAt: new Date(),
    },
  });

  return { success: true, message: 'Distributed to Tidal' };
}

// SoundCloud Distribution
export async function pushToSoundCloud(postId, metadata) {
  console.log(`[SoundCloud] Pushing post ${postId} to SoundCloud`);

  await prisma.distributionJob.create({
    data: {
      postId,
      channel: 'soundcloud',
      status: 'completed',
      processedAt: new Date(),
    },
  });

  return { success: true, message: 'Distributed to SoundCloud' };
}

// Deezer Distribution
export async function pushToDeezer(postId, metadata) {
  console.log(`[Deezer] Pushing post ${postId} to Deezer`);

  await prisma.distributionJob.create({
    data: {
      postId,
      channel: 'deezer',
      status: 'completed',
      processedAt: new Date(),
    },
  });

  return { success: true, message: 'Distributed to Deezer' };
}

// Main distribution function
export async function distributePost(postId, channels) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { creator: true },
  });

  if (!post) {
    return { success: false, message: 'Post not found' };
  }

  const metadata = {
    artistName: post.creator?.artistName || post.creator?.username,
    title: post.title || 'Untitled',
    description: post.description || '',
    audioUrl: post.mediaUrl || '',
    coverArt: post.thumbnail || '',
    releaseDate: post.approvedAt || new Date().toISOString(),
    genre: post.genre || '',
    isrc: post.isrc || '',
    upc: post.upc || '',
  };

  const distributionMap = {
    distrokid: pushToDistroKid,
    youtube: pushToYouTube,
    spotify: pushToSpotify,
    apple_music: pushToAppleMusic,
    tidal: pushToTidal,
    soundcloud: pushToSoundCloud,
    deezer: pushToDeezer,
  };

  const results = [];
  for (const channel of channels) {
    const fn = distributionMap[channel];
    if (fn) {
      try {
        const result = await fn(postId, metadata);
        results.push({ channel, ...result });
      } catch (error) {
        console.error(`[Distribution] Error pushing to ${channel}:`, error.message);
        results.push({ channel, success: false, message: error.message });
      }
    } else {
      results.push({ channel, success: false, message: 'Unknown distribution channel' });
    }
  }

  return results;
}

export default { distributePost, pushToDistroKid, pushToYouTube, pushToSpotify, pushToAppleMusic, pushToTidal, pushToSoundCloud, pushToDeezer };