'use client';

import { FullscreenHero } from '../website/hero/FullscreenHero';
import { StatsBar } from '../website/shared/StatsBar';
import { MusicGrid } from '../website/content/MusicGrid';
import { VideoGrid } from '../website/content/VideoGrid';
import { PhotoGallery } from '../website/content/PhotoGallery';
import { EventsList } from '../website/content/EventsList';
import { BTSSection } from '../website/content/BTSSection';
import SocialLinks from '../website/shared/SocialLinks';
import Footer from '../website/shared/Footer';
import { AnimatedMarquee } from '../website/layout/AnimatedMarquee';
import StaggeredElements from '../website/layout/StaggeredElements';

interface SpectrumSteezeProps {
  creator: any;
  isCreator: boolean;
  previewAsFan?: boolean;
  followStatus?: boolean;
  onFollow?: () => void;
  isFollowLoading?: boolean;
}

export default function SpectrumSteeze({
  creator,
  isCreator,
  previewAsFan = false,
  followStatus,
  onFollow,
  isFollowLoading
}: SpectrumSteezeProps) {
  const tracks = creator?.tracks || [];
  const videos = creator?.videos || [];
  const photos = creator?.photos || creator?.images || [];
  const events = creator?.events || [];
  const btsItems = creator?.btsItems || [];

  // Prepare staggered items for Spectrum theme (colorful, dynamic layout)
  const staggeredItems = [
    ...tracks.slice(0, 3).map((track: any, idx: number) => ({
      id: `track-${track.id}`,
      content: (
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-4 border border-white/10 hover:border-white/30 transition-all">
          <h3 className="text-white font-bold text-lg">{track.title}</h3>
          <p className="text-gray-300 text-sm">{track.artist}</p>
        </div>
      ),
      span: idx === 0 ? 2 : 1,
      offset: idx * 20
    })),
    ...videos.slice(0, 2).map((video: any, idx: number) => ({
      id: `video-${video.id}`,
      content: (
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl p-4 border border-white/10 hover:border-white/30 transition-all">
          <h3 className="text-white font-bold text-lg">{video.title}</h3>
          <p className="text-gray-300 text-sm">Watch now →</p>
        </div>
      ),
      span: 1,
      offset: idx * 30
    }))
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="spectrum-steeze">
        {/* Animated Marquee - Rainbow colors */}
        <AnimatedMarquee
          text="🌈 COLORFUL • VIBRANT • ENERGETIC • DYNAMIC • SPECTRUM 🌈"
          backgroundColor="bg-gradient-to-r from-red-600 via-yellow-500 to-green-600 via-blue-600 to-purple-600"
          textColor="text-white"
          speed={40}
        />

        <FullscreenHero
          backgroundImage={creator?.heroImage || '/images/default-hero.jpg'}
          title={creator?.artistName || 'Artist Name'}
          primaryButtonText="Subscribe"
          primaryButtonLink={`/creator/${creator?.username}/subscribe`}
          secondaryButtonText="Follow"
          secondaryButtonOnClick={onFollow}
          tagline={creator?.tagline}
          shortBio={creator?.shortBio}
          profilePicUrl={creator?.profilePicUrl}
        />

        <StatsBar
          stats={{
            followers: creator?._count?.followers || creator?.followerCount || 0,
            following: creator?._count?.following || creator?.followingCount || 0,
            totalLikes: creator?._count?.totalLikes || creator?.totalLikes || 0
          }}
        />

        {/* Staggered Elements - Magazine style layout for Spectrum */}
        {staggeredItems.length > 0 && (
          <StaggeredElements
            items={staggeredItems}
            columns={3}
            staggerAmount={50}
            overlap={true}
            className="py-8"
            itemClassName="hover:scale-105 transition-all duration-300"
          />
        )}

        {tracks.length > 0 && (
          <MusicGrid
            tracks={tracks}
            title="🎵 SPECTRUM SOUNDS"
          />
        )}

        {videos.length > 0 && (
          <VideoGrid
            videos={videos}
            title="🎬 VISUAL SPECTRUM"
          />
        )}

        {photos.length > 0 && (
          <PhotoGallery
            photos={photos}
            title="🌈 COLOR GALLERY"
            layout="grid"
            columns={3}
          />
        )}

        {events.length > 0 && (
          <EventsList
            events={events}
            title="✨ UPCOMING EVENTS"
            layout="cards"
          />
        )}

        {btsItems.length > 0 && (
          <BTSSection
            items={btsItems}
            title="🔮 BEHIND THE SPECTRUM"
            layout="grid"
          />
        )}

        {creator?.socialLinks && Object.keys(creator.socialLinks).some(k => creator.socialLinks[k]) && (
          <SocialLinks
            links={creator.socialLinks}
            variant="icons"
            showLabels={false}
          />
        )}

        <Footer
          artistName={creator?.artistName || 'Creator'}
          templateId="spectrum"
          socialLinks={creator?.socialLinks}
          theme={{
            borderColor: 'border-white/20',
            accentColor: 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 via-blue-500 to-purple-500'
          }}
        />
      </div>
    </div>
  );
}