'use client';

import { useState } from 'react';

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

interface RebelTemplateProps {
  creator: any;
  isCreator: boolean;
  previewAsFan?: boolean;
  followStatus?: boolean;
  onFollow?: () => void;
  isFollowLoading?: boolean;
}

export default function RebelTemplate({
  creator,
  isCreator,
  previewAsFan = false,
  followStatus,
  onFollow,
  isFollowLoading
}: RebelTemplateProps) {
  const tracks = creator?.tracks || [];
  const videos = creator?.videos || [];
  const photos = creator?.photos || creator?.images || [];
  const events = creator?.events || [];
  const btsItems = creator?.btsItems || [];

  return (
    <div className="min-h-screen bg-black">
      <div className="rebel-steeze">
        <AnimatedMarquee
          text="🔥 NEW MUSIC • NEW VIBES • NEW ENERGY 🔥"
          backgroundColor="bg-red-600"
          textColor="text-white"
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

        {tracks.length > 0 && (
          <MusicGrid
            tracks={tracks}
            title="LATEST DROPS"
          />
        )}

        {videos.length > 0 && (
          <VideoGrid
            videos={videos}
            title="VISUALS"
          />
        )}

        {photos.length > 0 && (
          <PhotoGallery
            photos={photos}
            title="GALLERY"
            layout="grid"
            columns={3}
          />
        )}

        {events.length > 0 && (
          <EventsList
            events={events}
            title="TOUR DATES"
            layout="cards"
          />
        )}

        {btsItems.length > 0 && (
          <BTSSection
            items={btsItems}
            title="BEHIND THE SCENES"
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
          templateId="rebel"
          socialLinks={creator?.socialLinks}
          theme={{
            borderColor: 'border-red-500/30',
            accentColor: 'text-red-500'
          }}
        />
      </div>
    </div>
  );
}