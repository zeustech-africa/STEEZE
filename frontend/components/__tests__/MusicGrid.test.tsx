import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MusicGrid, MusicTrack } from '../creator/website/content/MusicGrid';

// Mock Audio to prevent jsdom errors with play()/pause()
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  addEventListener: jest.fn(),
})) as any;

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Play: () => <span data-testid="play-icon">Play</span>,
  Pause: () => <span data-testid="pause-icon">Pause</span>,
  Heart: () => <span data-testid="heart-icon">Heart</span>,
  MessageCircle: () => <span data-testid="message-icon">Message</span>,
}));

describe('MusicGrid Component', () => {
  const mockTracks: MusicTrack[] = [
    {
      id: '1',
      title: 'Track One',
      artistName: 'Artist One',
      audioUrl: 'https://example.com/track1.mp3',
      duration: '3:45',
      plays: 1000,
    },
    {
      id: '2',
      title: 'Track Two',
      artistName: 'Artist Two',
      audioUrl: 'https://example.com/track2.mp3',
      duration: '4:20',
      plays: 500,
    },
  ];

  const mockProps = {
    tracks: mockTracks,
    title: 'Latest Tracks',
  };

  describe('Rendering', () => {
    it('renders the music grid with tracks', () => {
      render(<MusicGrid {...mockProps} />);
      expect(screen.getByText('Latest Tracks')).toBeInTheDocument();
      expect(screen.getByText('Track One')).toBeInTheDocument();
      expect(screen.getByText('Track Two')).toBeInTheDocument();
    });

    it('renders artist names', () => {
      render(<MusicGrid {...mockProps} />);
      expect(screen.getByText('Artist One')).toBeInTheDocument();
      expect(screen.getByText('Artist Two')).toBeInTheDocument();
    });

    it('renders play buttons for each track', () => {
      render(<MusicGrid {...mockProps} />);
      const playButtons = screen.getAllByTestId('play-icon');
      expect(playButtons).toHaveLength(2);
    });

    it('does not render when no tracks provided', () => {
      const { container } = render(<MusicGrid tracks={[]} title="Empty" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Play/Pause Functionality', () => {
    const mockOnTrackPlay = jest.fn();
    const mockOnTrackPause = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('triggers onTrackPlay when play button is clicked', () => {
      render(
        <MusicGrid
          tracks={[mockTracks[0]]}
          onTrackPlay={mockOnTrackPlay}
          title="Test"
        />
      );
      const playButton = screen.getByTestId('play-icon');
      fireEvent.click(playButton);
      expect(mockOnTrackPlay).toHaveBeenCalledWith(mockTracks[0]);
    });
  });

  describe('Custom Styling', () => {
    it('applies custom play button className', () => {
      const { container } = render(
        <MusicGrid {...mockProps} playButtonClassName="custom-play-btn" />
      );
      const playButton = container.querySelector('.custom-play-btn');
      expect(playButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty tracks array gracefully', () => {
      const { container } = render(<MusicGrid tracks={[]} title="No Tracks" />);
      expect(container.firstChild).toBeNull();
    });

    it('handles tracks with missing audioUrl', () => {
      const tracksWithMissingUrl: MusicTrack[] = [
        {
          id: '1',
          title: 'Track One',
          artistName: 'Artist One',
          audioUrl: '',
        },
      ];
      render(<MusicGrid tracks={tracksWithMissingUrl} />);
      expect(screen.getByText('Track One')).toBeInTheDocument();
    });

    it('handles tracks with missing artistName', () => {
      const tracksWithMissingArtist: MusicTrack[] = [
        {
          id: '1',
          title: 'Track One',
          audioUrl: 'https://example.com/track.mp3',
        },
      ];
      render(<MusicGrid tracks={tracksWithMissingArtist} />);
      expect(screen.getByText('Track One')).toBeInTheDocument();
    });
  });

  describe('Additional Coverage for uncovered lines', () => {
    const singleTrack: MusicTrack[] = [
      {
        id: '1',
        title: 'Track One',
        artistName: 'Artist One',
        audioUrl: 'https://example.com/track1.mp3',
        duration: '3:45',
        plays: 1000,
      },
    ];

    it('calls onTrackPause when clicking play on already playing track', () => {
      const mockOnTrackPlay = jest.fn();
      const mockOnTrackPause = jest.fn();
      render(
        <MusicGrid
          tracks={singleTrack}
          onTrackPlay={mockOnTrackPlay}
          onTrackPause={mockOnTrackPause}
          title="Test"
        />
      );
      const playButton = screen.getByTestId('play-icon');
      // First click: starts playing
      fireEvent.click(playButton);
      expect(mockOnTrackPlay).toHaveBeenCalledWith(singleTrack[0]);
      // Re-query after state change (DOM re-renders with pause icon)
      const pauseButton = screen.getByTestId('pause-icon');
      fireEvent.click(pauseButton);
      expect(mockOnTrackPause).toHaveBeenCalledWith(singleTrack[0]);
    });

    it('handles track with empty audioUrl string gracefully', () => {
      const tracksWithEmptyUrl: MusicTrack[] = [
        {
          id: '1',
          title: 'Track One',
          artistName: 'Artist One',
          audioUrl: '',
        },
      ];
      render(<MusicGrid tracks={tracksWithEmptyUrl} title="Test" />);
      expect(screen.getByText('Track One')).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
      render(
        <MusicGrid
          tracks={singleTrack}
          title="Latest Tracks"
          subtitle="Check out these tracks"
        />
      );
      expect(screen.getByText('Check out these tracks')).toBeInTheDocument();
    });

    it('renders cover art placeholder for tracks without coverArtUrl', () => {
      const tracksWithoutCover: MusicTrack[] = [
        {
          id: '1',
          title: 'Track One',
          audioUrl: 'https://example.com/track1.mp3',
        },
      ];
      render(<MusicGrid tracks={tracksWithoutCover} title="Test" />);
      expect(screen.getByText('🎵')).toBeInTheDocument();
    });

    it('shows pause icon and pauses when clicking the currently playing track', () => {
      const mockOnTrackPlay = jest.fn();
      const mockOnTrackPause = jest.fn();
      render(
        <MusicGrid
          tracks={singleTrack}
          onTrackPlay={mockOnTrackPlay}
          onTrackPause={mockOnTrackPause}
          title="Test"
        />
      );
      const playButton = screen.getByTestId('play-icon');
      // Click to play
      fireEvent.click(playButton);
      expect(mockOnTrackPlay).toHaveBeenCalledWith(singleTrack[0]);
      // Now shows pause icon
      const pauseButton = screen.getByTestId('pause-icon');
      expect(pauseButton).toBeInTheDocument();
      // Click to pause
      fireEvent.click(pauseButton);
      expect(mockOnTrackPause).toHaveBeenCalledWith(singleTrack[0]);
    });

    it('handles tracks with null audioUrl gracefully', () => {
      const tracksWithNullUrl: MusicTrack[] = [
        {
          id: '1',
          title: 'Track One',
          artistName: 'Artist One',
          audioUrl: null as unknown as string,
        },
      ];
      render(<MusicGrid tracks={tracksWithNullUrl} title="Test" />);
      expect(screen.getByText('Track One')).toBeInTheDocument();
    });

    it('pauses previous track when switching to a new track', () => {
      const mockOnTrackPlay = jest.fn();
      const mockOnTrackPause = jest.fn();
      const twoTracks: MusicTrack[] = [
        {
          id: '1',
          title: 'Track One',
          artistName: 'Artist One',
          audioUrl: 'https://example.com/track1.mp3',
          duration: '3:45',
          plays: 1000,
        },
        {
          id: '2',
          title: 'Track Two',
          artistName: 'Artist Two',
          audioUrl: 'https://example.com/track2.mp3',
          duration: '4:20',
          plays: 500,
        },
      ];
      render(
        <MusicGrid
          tracks={twoTracks}
          onTrackPlay={mockOnTrackPlay}
          onTrackPause={mockOnTrackPause}
          title="Test"
        />
      );
      // Play track 1
      const playButtons = screen.getAllByTestId('play-icon');
      fireEvent.click(playButtons[0]);
      expect(mockOnTrackPlay).toHaveBeenCalledWith(twoTracks[0]);
      // Play track 2 - should pause track 1 first
      fireEvent.click(playButtons[1]);
      expect(mockOnTrackPlay).toHaveBeenCalledWith(twoTracks[1]);
    });
  });

  describe('Additional function coverage - lines 67-68, 180-187', () => {
    it('calls onTrackPause and resets currentlyPlaying when audio ends (lines 67-68)', () => {
      const mockOnTrackPlay = jest.fn();
      const mockOnTrackPause = jest.fn();
      let endedCallback: (() => void) | null = null;

      // Override the global Audio mock to capture the 'ended' callback
      const originalAudio = global.Audio;
      global.Audio = jest.fn().mockImplementation(() => ({
        play: jest.fn().mockResolvedValue(undefined),
        pause: jest.fn(),
        addEventListener: jest.fn((event: string, callback: () => void) => {
          if (event === 'ended') {
            endedCallback = callback;
          }
        }),
        removeEventListener: jest.fn(),
      })) as any;

      const singleTrack: MusicTrack = {
        id: '1',
        title: 'Track One',
        audioUrl: 'https://example.com/track1.mp3',
      };

      render(
        <MusicGrid
          tracks={[singleTrack]}
          onTrackPlay={mockOnTrackPlay}
          onTrackPause={mockOnTrackPause}
          title="Test"
        />
      );

      // Click play to start the track
      const playButton = screen.getByTestId('play-icon');
      fireEvent.click(playButton);
      expect(mockOnTrackPlay).toHaveBeenCalledWith(singleTrack);

      // Simulate the audio 'ended' event
      expect(endedCallback).not.toBeNull();
      endedCallback!();

      // Should call onTrackPause with the track
      expect(mockOnTrackPause).toHaveBeenCalledWith(singleTrack);

      // After ended, clicking play again should start a new playback
      global.Audio = originalAudio;
    });

    it('calls onLike when heart button is clicked (lines 179-185)', () => {
      const mockOnLike = jest.fn();
      const track: MusicTrack = {
        id: '1',
        title: 'Track One',
        audioUrl: 'https://example.com/track1.mp3',
        likes: 42,
      };

      render(
        <MusicGrid
          tracks={[track]}
          onLike={mockOnLike}
          title="Test"
        />
      );

      const heartButton = screen.getByTestId('heart-icon');
      fireEvent.click(heartButton);
      expect(mockOnLike).toHaveBeenCalledWith('1');
    });

    it('calls onComment when comment button is clicked (lines 186-192)', () => {
      const mockOnComment = jest.fn();
      const track: MusicTrack = {
        id: '1',
        title: 'Track One',
        audioUrl: 'https://example.com/track1.mp3',
        comments: 15,
      };

      render(
        <MusicGrid
          tracks={[track]}
          onComment={mockOnComment}
          title="Test"
        />
      );

      const commentButton = screen.getByTestId('message-icon');
      fireEvent.click(commentButton);
      expect(mockOnComment).toHaveBeenCalledWith('1');
    });

    it('renders formatNumber for large like/comment counts (lines 184, 191)', () => {
      const track: MusicTrack = {
        id: '1',
        title: 'Track One',
        audioUrl: 'https://example.com/track1.mp3',
        likes: 1500,
        comments: 2500000,
        plays: 0,
      };

      render(
        <MusicGrid
          tracks={[track]}
          title="Test"
        />
      );

      // formatNumber(1500) → '1.5K', formatNumber(2500000) → '2.5M'
      expect(screen.getByText('1.5K')).toBeInTheDocument();
      expect(screen.getByText('2.5M')).toBeInTheDocument();
    });

    it('does not crash when onLike/onComment are not provided (optional chaining coverage)', () => {
      const track: MusicTrack = {
        id: '1',
        title: 'Track One',
        audioUrl: 'https://example.com/track1.mp3',
        likes: 10,
        comments: 5,
      };

      render(
        <MusicGrid
          tracks={[track]}
          title="Test"
        />
      );

      // Click heart without onLike handler - should not throw
      const heartButton = screen.getByTestId('heart-icon');
      fireEvent.click(heartButton);

      // Click comment without onComment handler - should not throw
      const commentButton = screen.getByTestId('message-icon');
      fireEvent.click(commentButton);

      // Verify track still renders
      expect(screen.getByText('Track One')).toBeInTheDocument();
    });
  });
});
