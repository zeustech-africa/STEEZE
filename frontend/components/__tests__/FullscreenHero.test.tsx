import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FullscreenHero } from '../creator/website/hero/FullscreenHero';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, priority, ...props }: Record<string, unknown> & { fill?: boolean; priority?: boolean }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} alt={props.alt as string} src={props.src as string} />;
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="chevron-down">ChevronDown</span>,
}));

describe('FullscreenHero Component', () => {
  const mockProps = {
    backgroundImage: '/images/test-hero.jpg',
    title: 'Test Artist',
    primaryButtonText: 'Subscribe',
    primaryButtonLink: '/subscribe',
    secondaryButtonText: 'Follow',
    secondaryButtonLink: '#',
    secondaryButtonOnClick: jest.fn(),
    tagline: 'The Future of Music',
    shortBio: 'This is a short bio',
    profilePicUrl: '/images/profile.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the hero section with title', () => {
      render(<FullscreenHero {...mockProps} />);
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
    });

    it('renders primary button with text', () => {
      render(<FullscreenHero {...mockProps} />);
      expect(screen.getByText('Subscribe')).toBeInTheDocument();
    });

    it('renders secondary button with text', () => {
      render(<FullscreenHero {...mockProps} />);
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    it('renders tagline when provided', () => {
      render(<FullscreenHero {...mockProps} />);
      expect(screen.getByText('The Future of Music')).toBeInTheDocument();
    });

    it('does not render tagline when not provided', () => {
      const propsWithoutTagline = { ...mockProps, tagline: undefined };
      render(<FullscreenHero {...propsWithoutTagline} />);
      expect(screen.queryByText('The Future of Music')).not.toBeInTheDocument();
    });

    it('renders shortBio when provided', () => {
      render(<FullscreenHero {...mockProps} />);
      expect(screen.getByText('This is a short bio')).toBeInTheDocument();
    });

    it('does not render shortBio when not provided', () => {
      const propsWithoutBio = { ...mockProps, shortBio: undefined };
      render(<FullscreenHero {...propsWithoutBio} />);
      expect(screen.queryByText('This is a short bio')).not.toBeInTheDocument();
    });

    it('renders profile image when profilePicUrl provided', () => {
      render(<FullscreenHero {...mockProps} />);
      const profileImage = screen.getByAltText('Profile');
      expect(profileImage).toBeInTheDocument();
      expect(profileImage).toHaveAttribute('src', '/images/profile.jpg');
    });

    it('does not render profile image when profilePicUrl not provided', () => {
      const propsWithoutProfile = { ...mockProps, profilePicUrl: undefined };
      render(<FullscreenHero {...propsWithoutProfile} />);
      expect(screen.queryByAltText('Profile')).not.toBeInTheDocument();
    });
  });

  describe('Button Actions', () => {
    it('calls secondaryButtonOnClick when secondary button is clicked', () => {
      render(<FullscreenHero {...mockProps} />);
      const followButton = screen.getByText('Follow');
      fireEvent.click(followButton);
      expect(mockProps.secondaryButtonOnClick).toHaveBeenCalled();
    });

    it('calls primaryButtonOnClick when primary button is clicked', () => {
      const primaryOnClick = jest.fn();
      render(
        <FullscreenHero
          {...mockProps}
          primaryButtonOnClick={primaryOnClick}
          primaryButtonLink={undefined}
        />
      );
      const primaryButton = screen.getByText('Subscribe');
      fireEvent.click(primaryButton);
      expect(primaryOnClick).toHaveBeenCalled();
    });

    it('secondary button click fires secondaryButtonOnClick even without link', () => {
      const onClick = jest.fn();
      render(
        <FullscreenHero
          {...mockProps}
          secondaryButtonOnClick={onClick}
          secondaryButtonLink={undefined}
        />
      );
      const followButton = screen.getByText('Follow');
      fireEvent.click(followButton);
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom button style when buttonStyle prop provided', () => {
      render(
        <FullscreenHero {...mockProps} buttonStyle="custom-button-class" />
      );
      const primaryButton = screen.getByText('Subscribe');
      expect(primaryButton).toHaveClass('custom-button-class');
    });

    it('applies default gold button class when no buttonStyle provided', () => {
      render(<FullscreenHero {...mockProps} />);
      const primaryButton = screen.getByText('Subscribe');
      expect(primaryButton).toHaveClass('bg-gold');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing backgroundImage gracefully', () => {
      const propsWithoutBg = { ...mockProps, backgroundImage: undefined };
      render(<FullscreenHero {...propsWithoutBg} />);
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
    });

    it('handles missing primaryButtonLink gracefully (uses onClick instead)', () => {
      const propsWithoutLink = { ...mockProps, primaryButtonLink: undefined };
      render(<FullscreenHero {...propsWithoutLink} />);
      const primaryButton = screen.getByText('Subscribe');
      expect(primaryButton).toBeInTheDocument();
    });

    it('handles missing secondaryButtonOnClick gracefully', () => {
      const propsWithoutCallback = { ...mockProps, secondaryButtonOnClick: undefined };
      render(<FullscreenHero {...propsWithoutCallback} />);
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    it('renders nothing secondary-related when no secondaryButtonText', () => {
      const propsWithoutSecondary = { ...mockProps, secondaryButtonText: undefined };
      render(<FullscreenHero {...propsWithoutSecondary} />);
      expect(screen.queryByText('Follow')).not.toBeInTheDocument();
    });
  });

  describe('Coverage for uncovered lines 81-84, 101-102, 109-110, 115', () => {
    it('covers animation setTimeout styles (lines 81-84) when animateText is true', () => {
      jest.useFakeTimers();
      render(<FullscreenHero {...mockProps} />);

      // The useEffect sets timeouts for opacity/transform transitions
      // Running all timers should apply the inline styles
      jest.runAllTimers();

      const title = screen.getByText('Test Artist');
      expect(title.style.opacity).toBe('1');
      expect(title.style.transform).toBe('translateY(0)');
      expect(title.style.transition).toBe('opacity 0.6s ease-out, transform 0.6s ease-out');

      jest.useRealTimers();
    });

    it('covers handlePrimaryClick fallback to primaryButtonLink (lines 101-102)', () => {
      render(
        <FullscreenHero
          {...mockProps}
          primaryButtonOnClick={undefined}
          primaryButtonLink="/subscribe-page"
        />
      );

      const primaryButton = screen.getByText('Subscribe');
      fireEvent.click(primaryButton);

      // The click executes window.location.href = '/subscribe-page' (lines 101-102)
      // Button renders as <button> (not <a>), so we just verify no crash
      expect(primaryButton).toBeInTheDocument();
    });

    it('covers handleSecondaryClick fallback to secondaryButtonLink (lines 109-110)', () => {
      render(
        <FullscreenHero
          {...mockProps}
          secondaryButtonOnClick={undefined}
          secondaryButtonLink="/follow-page"
        />
      );

      const secondaryButton = screen.getByText('Follow');
      fireEvent.click(secondaryButton);

      // The click executes window.location.href = '/follow-page' (lines 109-110)
      expect(secondaryButton).toBeInTheDocument();
    });

    it('covers scrollToNextSection calling window.scrollTo (line 115)', () => {
      const scrollToMock = jest.fn();
      window.scrollTo = scrollToMock;

      render(<FullscreenHero {...mockProps} />);

      const scrollIndicator = screen.getByLabelText('Scroll down');
      fireEvent.click(scrollIndicator);

      expect(scrollToMock).toHaveBeenCalledWith({
        top: window.innerHeight,
        behavior: 'smooth',
      });

      // Restore
      window.scrollTo = window.scrollTo;
    });

    it('covers animateText=true useEffect animation trigger with all elements present', () => {
      jest.useFakeTimers();
      render(<FullscreenHero {...mockProps} />);

      // Before timers fire, elements should have opacity 0 and translateY(20px)
      const title = screen.getByText('Test Artist');
      expect(title.style.opacity).toBe('0');
      expect(title.style.transform).toBe('translateY(20px)');

      jest.runAllTimers();

      expect(title.style.opacity).toBe('1');
      expect(title.style.transform).toBe('translateY(0)');

      jest.useRealTimers();
    });

    it('covers animateText=false early return (line 73)', () => {
      jest.useFakeTimers();
      render(<FullscreenHero {...mockProps} animateText={false} />);

      const title = screen.getByText('Test Artist');
      // No animation applied - styles remain at browser defaults (empty)
      expect(title.style.opacity).toBe('');
      expect(title.style.transform).toBe('');

      jest.runAllTimers();
      // Still no animation styles applied
      expect(title.style.opacity).toBe('');
      expect(title.style.transform).toBe('');

      jest.useRealTimers();
    });

    it('covers backgroundVideo branch (line 124)', () => {
      const propsWithVideo = {
        ...mockProps,
        backgroundVideo: '/videos/test-hero.mp4',
        backgroundImage: undefined,
      };
      const { container } = render(<FullscreenHero {...propsWithVideo} />);
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', '/videos/test-hero.mp4');
    });

    it('covers contentAlignment="left" (line 152 else branch)', () => {
      render(<FullscreenHero {...mockProps} contentAlignment="left" />);
      const profileImage = screen.getByAltText('Profile');
      expect(profileImage).toBeInTheDocument();
      // Alignment class should be text-left
      const contentDiv = screen.getByText('Test Artist').closest('div.flex-col');
      expect(contentDiv).toHaveClass('text-left');
    });

    it('covers contentAlignment="right" alignment classes', () => {
      render(<FullscreenHero {...mockProps} contentAlignment="right" />);
      const contentDiv = screen.getByText('Test Artist').closest('div.flex-col');
      expect(contentDiv).toHaveClass('text-right');
      expect(contentDiv).toHaveClass('items-end');
    });

    it('covers both primaryButtonText and secondaryButtonText undefined (lines 190-191 falsy)', () => {
      const minimalProps = {
        title: 'Minimal Hero',
        backgroundImage: '/images/test-hero.jpg',
      };
      render(<FullscreenHero {...minimalProps} />);
      expect(screen.getByText('Minimal Hero')).toBeInTheDocument();
      // No button container should be rendered
      expect(screen.queryByText('Subscribe')).not.toBeInTheDocument();
      expect(screen.queryByText('Follow')).not.toBeInTheDocument();
    });

    it('covers showScrollIndicator=false (line 213 falsy)', () => {
      render(<FullscreenHero {...mockProps} showScrollIndicator={false} />);
      expect(screen.queryByLabelText('Scroll down')).not.toBeInTheDocument();
    });

    it('covers backgroundImage branch when backgroundVideo is undefined (line 133 truthy)', () => {
      const { container } = render(<FullscreenHero {...mockProps} />);
      // Image should be rendered via next/image mock
      const img = screen.getByAltText('Hero background');
      expect(img).toBeInTheDocument();
    });
  });
});
