'use client';

import { FullscreenHero } from '../website/hero/FullscreenHero';
import { StatsBar } from '../website/shared/StatsBar';
import { SplitScreenLayout } from '../website/layout/SplitScreenLayout';
import { AsymmetricGrid } from '../website/layout/AsymmetricGrid';
import { MusicGrid } from '../website/content/MusicGrid';
import { VideoGrid } from '../website/content/VideoGrid';
import { PhotoGallery } from '../website/content/PhotoGallery';
import { EventsList } from '../website/content/EventsList';
import { BTSSection } from '../website/content/BTSSection';
import SocialLinks from '../website/shared/SocialLinks';
import Footer from '../website/shared/Footer';

interface LuminarySteezeProps {
  creator: any;
  isCreator: boolean;
  previewAsFan?: boolean;
  followStatus?: boolean;
  onFollow?: () => void;
  isFollowLoading?: boolean;
}

export default function LuminarySteeze({
  creator,
  isCreator,
  previewAsFan = false,
  followStatus,
  onFollow,
  isFollowLoading
}: LuminarySteezeProps) {
  const tracks = creator?.tracks || [];
  const videos = creator?.videos || [];
  const photos = creator?.photos || creator?.images || [];
  const events = creator?.events || [];
  const btsItems = creator?.btsItems || [];

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="luminary-steeze">
        {/* FullscreenHero — editorial elegance, no marquee */}
        <FullscreenHero
          backgroundImage={creator?.heroImage || '/images/default-hero.jpg'}
          title={creator?.artistName || 'Artist Name'}
          tagline={creator?.tagline || 'LUMINARY STEEZE'}
          shortBio={creator?.shortBio}
          profilePicUrl={creator?.profilePicUrl}
          primaryButtonText="Subscribe"
          primaryButtonLink={`/creator/${creator?.username}/subscribe`}
          secondaryButtonText="Follow"
          secondaryButtonOnClick={onFollow}
        />

        {/* Stats Bar — gold values, editorial typography */}
        <StatsBar
          stats={{
            followers: creator?._count?.followers || creator?.followerCount || 0,
            following: creator?._count?.following || creator?.followingCount || 0,
            totalLikes: creator?._count?.totalLikes || creator?.totalLikes || 0
          }}
        />

        {/* Split Screen Layout — editorial split view */}
        {creator?.splitScreenContent && (
          <SplitScreenLayout
            title="FEATURED STORY"
            description={creator.splitScreenContent}
          />
        )}

        {/* Asymmetric Grid — magazine-style editorial grid */}
        {creator?.asymmetricContent && (
          <AsymmetricGrid
            title="EDITORIAL PICKS"
            items={creator.asymmetricContent}
          />
        )}

        {/* Music Grid — navy/gold theme, MusicGrid manages its own audio */}
        {tracks.length > 0 && (
          <MusicGrid
            tracks={tracks}
            title="DISCOGRAPHY"
            columns={2}
          />
        )}

        {/* Video Grid */}
        {videos.length > 0 && (
          <VideoGrid
            videos={videos}
            title="VISUAL NARRATIVES"
          />
        )}

        {/* Photo Gallery — editorial portfolio */}
        {photos.length > 0 && (
          <PhotoGallery
            photos={photos}
            title="PORTFOLIO"
            layout="grid"
            columns={3}
          />
        )}

        {/* Events List */}
        {events.length > 0 && (
          <EventsList
            events={events}
            title="PREMIERE DATES"
            layout="cards"
          />
        )}

        {/* BTS Section */}
        {btsItems.length > 0 && (
          <BTSSection
            items={btsItems}
            title="BEHIND THE EDITORIAL"
            layout="grid"
          />
        )}

        {/* Social Links — gold hover effects */}
        {creator?.socialLinks && Object.keys(creator.socialLinks).some(k => creator.socialLinks[k]) && (
          <SocialLinks
            links={creator.socialLinks}
            variant="icons"
            showLabels={false}
          />
        )}

        {/* Footer — luminary gold theme */}
        <Footer
          artistName={creator?.artistName || 'Creator'}
          templateId="luminary"
          socialLinks={creator?.socialLinks}
          theme={{
            borderColor: 'border-gold/30',
            accentColor: 'text-gold'
          }}
        />
      </div>
    </div>
  );
}
