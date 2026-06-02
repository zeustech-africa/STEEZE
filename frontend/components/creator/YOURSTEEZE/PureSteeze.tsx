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

interface PureSteezeProps {
  creator: any;
  isCreator: boolean;
  previewAsFan?: boolean;
  followStatus?: boolean;
  onFollow?: () => void;
  isFollowLoading?: boolean;
}

export default function PureSteeze({
  creator,
  isCreator,
  previewAsFan = false,
  followStatus,
  onFollow,
  isFollowLoading
}: PureSteezeProps) {
  const tracks = creator?.tracks || [];
  const videos = creator?.videos || [];
  const photos = creator?.photos || creator?.images || [];
  const events = creator?.events || [];
  const btsItems = creator?.btsItems || [];

  return (
    <div className="min-h-screen bg-white">
      <div className="pure-steeze">
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
            title="MUSIC"
          />
        )}

        {videos.length > 0 && (
          <VideoGrid
            videos={videos}
            title="VIDEOS"
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
            title="EVENTS"
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
          templateId="pure"
          socialLinks={creator?.socialLinks}
          theme={{
            borderColor: 'border-gray-200',
            accentColor: 'text-black'
          }}
        />
      </div>
    </div>
  );
}