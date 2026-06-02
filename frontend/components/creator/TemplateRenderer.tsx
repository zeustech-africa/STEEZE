'use client';

import IconSteeze from './YOURSTEEZE/IconSteeze';
import RebelSteeze from './YOURSTEEZE/RebelSteeze';
import DivaSteeze from './YOURSTEEZE/DivaSteeze';
import VisionarySteeze from './YOURSTEEZE/VisionarySteeze';
import PureSteeze from './YOURSTEEZE/PureSteeze';
import SpectrumSteeze from './YOURSTEEZE/SpectrumSteeze';
import LuminarySteeze from './YOURSTEEZE/LuminarySteeze';

interface TemplateRendererProps {
  creator: any;
  isCreator: boolean;
  previewAsFan?: boolean;
  followStatus?: any;
  onFollow?: () => void;
  isFollowLoading?: boolean;
  templateId?: string;
}

export default function TemplateRenderer({
  creator,
  isCreator,
  previewAsFan = false,
  followStatus,
  onFollow,
  isFollowLoading,
  templateId = 'icon'
}: TemplateRendererProps) {
  // Render the appropriate STEEZE based on templateId
  switch (templateId) {
    case 'rebel':
      return (
        <RebelSteeze
          creator={creator}
          isCreator={isCreator}
          previewAsFan={previewAsFan}
          followStatus={followStatus}
          onFollow={onFollow}
          isFollowLoading={isFollowLoading}
        />
      );
    case 'diva':
      return (
        <DivaSteeze
          creator={creator}
          isCreator={isCreator}
          previewAsFan={previewAsFan}
          followStatus={followStatus}
          onFollow={onFollow}
          isFollowLoading={isFollowLoading}
        />
      );
    case 'visionary':
      return (
        <VisionarySteeze
          creator={creator}
          isCreator={isCreator}
          previewAsFan={previewAsFan}
          followStatus={followStatus}
          onFollow={onFollow}
          isFollowLoading={isFollowLoading}
        />
      );
    case 'pure':
      return (
        <PureSteeze
          creator={creator}
          isCreator={isCreator}
          previewAsFan={previewAsFan}
          followStatus={followStatus}
          onFollow={onFollow}
          isFollowLoading={isFollowLoading}
        />
      );
    case 'spectrum':
      return (
        <SpectrumSteeze
          creator={creator}
          isCreator={isCreator}
          previewAsFan={previewAsFan}
          followStatus={followStatus}
          onFollow={onFollow}
          isFollowLoading={isFollowLoading}
        />
      );
    case 'luminary':
      return (
        <LuminarySteeze
          creator={creator}
          isCreator={isCreator}
          previewAsFan={previewAsFan}
          followStatus={followStatus}
          onFollow={onFollow}
          isFollowLoading={isFollowLoading}
        />
      );
    default: // 'icon'
      return (
        <IconSteeze
          creator={creator}
          isCreator={isCreator}
          previewAsFan={previewAsFan}
          followStatus={followStatus}
          onFollow={onFollow}
          isFollowLoading={isFollowLoading}
        />
      );
  }
}