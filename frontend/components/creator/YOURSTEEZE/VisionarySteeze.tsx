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

interface VisionarySteezeProps {
  creator: any;
  isCreator: boolean;
  previewAsFan?: boolean;
  followStatus?: boolean;
  onFollow?: () => void;
  isFollowLoading?: boolean;
}

export default function VisionarySteeze({
  creator,
  isCreator,
  previewAsFan = false,
  followStatus,
  onFollow,
  isFollowLoading
}: VisionarySteezeProps) {
  const tracks = creator?.tracks || [];
  const videos = creator?.videos || [];
  const photos = creator?.photos || creator?.images || [];
  const events = creator?.events || [];
  const btsItems = creator?.btsItems || [];

  return (
    <div className="min-h-screen bg-black">
      <div className="visionary-steeze">
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
          buttonStyle="bg-gradient-to-r from-gold to-gold-dark hover:scale-105 hover:shadow-lg text-black font-medium rounded-md transition-all duration-300 focus:ring-2 focus:ring-gold focus:outline-none focus:ring-offset-2"
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
            title="SOUNDSCAPES"
            playButtonClassName="bg-gradient-to-r from-gold to-gold-dark hover:scale-105 text-black rounded-md p-2 transition-all duration-300"
          />
        )}

        {videos.length > 0 && (
          <VideoGrid
            videos={videos}
            title="VISUAL STORIES"
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
            title="CINEMATIC EVENTS"
            layout="cards"
            ticketButtonClassName="bg-gradient-to-r from-gold to-gold-dark hover:scale-105 text-black font-medium rounded-md px-4 py-2 text-sm transition-all duration-300"
          />
        )}

        {btsItems.length > 0 && (
          <BTSSection
            items={btsItems}
            title="BEHIND THE VISION"
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
          templateId="visionary"
          socialLinks={creator?.socialLinks}
          theme={{
            borderColor: 'border-purple-600/40',
            accentColor: 'text-purple-600'
          }}
        />
      </div>
    </div>
  );
}