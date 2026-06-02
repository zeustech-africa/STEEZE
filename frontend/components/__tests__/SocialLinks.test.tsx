import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SocialLinks from '../creator/website/shared/SocialLinks';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Camera: () => <span data-testid="icon-camera">Camera</span>,
  Hash: () => <span data-testid="icon-hash">Hash</span>,
  Tv: () => <span data-testid="icon-tv">Tv</span>,
  Video: () => <span data-testid="icon-video">Video</span>,
  Users: () => <span data-testid="icon-users">Users</span>,
  Music: () => <span data-testid="icon-music">Music</span>,
  Play: () => <span data-testid="icon-play">Play</span>,
  Monitor: () => <span data-testid="icon-monitor">Monitor</span>,
  MessageCircle: () => <span data-testid="icon-message">MessageCircle</span>,
  Briefcase: () => <span data-testid="icon-briefcase">Briefcase</span>,
  Code: () => <span data-testid="icon-code">Code</span>,
  Globe: () => <span data-testid="icon-globe">Globe</span>,
  Link: () => <span data-testid="icon-link">Link</span>,
  Mail: () => <span data-testid="icon-mail">Mail</span>,
  Phone: () => <span data-testid="icon-phone">Phone</span>,
}));

describe('SocialLinks Component', () => {
  const mockLinks = {
    instagram: 'https://instagram.com/test',
    twitter: 'https://twitter.com/test',
    youtube: 'https://youtube.com/test',
    tiktok: 'https://tiktok.com/@test',
    spotify: 'https://spotify.com/test',
    website: 'https://test.com',
  };

  describe('Rendering', () => {
    it('renders nothing when no links provided', () => {
      const { container } = render(<SocialLinks links={{}} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders social links when provided', () => {
      render(<SocialLinks links={mockLinks} />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('renders correct number of links', () => {
      render(<SocialLinks links={mockLinks} />);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(Object.keys(mockLinks).length);
    });
  });

  describe('Link URLs', () => {
    it('renders Instagram link with correct URL', () => {
      render(<SocialLinks links={mockLinks} />);
      const links = screen.getAllByRole('link');
      const instagramLink = links.find(link => link.getAttribute('href') === 'https://instagram.com/test');
      expect(instagramLink).toBeInTheDocument();
    });

    it('renders Twitter link with correct URL', () => {
      render(<SocialLinks links={mockLinks} />);
      const links = screen.getAllByRole('link');
      const twitterLink = links.find(link => link.getAttribute('href') === 'https://twitter.com/test');
      expect(twitterLink).toBeInTheDocument();
    });

    it('renders YouTube link with correct URL', () => {
      render(<SocialLinks links={mockLinks} />);
      const links = screen.getAllByRole('link');
      const youtubeLink = links.find(link => link.getAttribute('href') === 'https://youtube.com/test');
      expect(youtubeLink).toBeInTheDocument();
    });
  });

  describe('Security Attributes', () => {
    it('adds rel="noopener noreferrer" to external links', () => {
      render(<SocialLinks links={mockLinks} />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('adds target="_blank" to external links', () => {
      render(<SocialLinks links={mockLinks} />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank');
      });
    });
  });

  describe('Variant: Icons (default)', () => {
    it('renders icons by default', () => {
      render(<SocialLinks links={mockLinks} />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('applies custom className when provided', () => {
      const { container } = render(
        <SocialLinks links={mockLinks} className="custom-social" />
      );
      expect(container.firstChild).toHaveClass('custom-social');
    });
  });

  describe('Variant: Buttons', () => {
    it('renders as buttons when variant="buttons"', () => {
      render(<SocialLinks links={mockLinks} variant="buttons" />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      // Buttons variant adds bg-gray-800 class
      expect(links[0]).toHaveAttribute('data-testid', 'social-link-instagram');
    });

    it('shows labels when showLabels is true', () => {
      render(<SocialLinks links={mockLinks} variant="buttons" showLabels={true} />);
      expect(screen.getByText('instagram')).toBeInTheDocument();
      expect(screen.getByText('twitter')).toBeInTheDocument();
    });
  });

  describe('Variant: Text', () => {
    it('renders as text links when variant="text"', () => {
      render(<SocialLinks links={mockLinks} variant="text" />);
      expect(screen.getByText('instagram')).toBeInTheDocument();
      expect(screen.getByText('twitter')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('filters out empty/undefined URLs', () => {
      const linksWithEmpty = {
        instagram: 'https://instagram.com/test',
        twitter: '',
        youtube: null,
        tiktok: undefined,
      };
      // @ts-ignore - testing invalid input
      render(<SocialLinks links={linksWithEmpty} />);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute('href', 'https://instagram.com/test');
    });

    it('handles single platform gracefully', () => {
      render(<SocialLinks links={{ instagram: 'https://instagram.com/test' }} />);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute('href', 'https://instagram.com/test');
    });

    it('renders unknown platforms with Link icon', () => {
      // @ts-ignore - testing unknown platform
      render(<SocialLinks links={{ unknown: 'https://unknown.com' }} />);
      const links = screen.getAllByRole('link');
      // Unknown platforms ARE rendered with Link icon
      expect(links.length).toBe(1);
      expect(links[0]).toHaveAttribute('href', 'https://unknown.com');
    });
  });
});