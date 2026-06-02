import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useParams: () => ({}),
  usePathname: () => '',
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowUp: () => <span data-testid="arrow-up-icon">ArrowUp</span>,
  Instagram: () => <span>Instagram</span>,
  Twitter: () => <span>Twitter</span>,
  Youtube: () => <span>Youtube</span>,
  Mail: () => <span>Mail</span>,
  Phone: () => <span>Phone</span>,
  MapPin: () => <span>MapPin</span>,
  Clock: () => <span>Clock</span>,
  Send: () => <span>Send</span>,
  Music: () => <span>Music</span>,
  Apple: () => <span>Apple</span>,
  Globe: () => <span>Globe</span>,
  Tiktok: () => <span>Tiktok</span>,
  Facebook: () => <span>Facebook</span>,
  Twitch: () => <span>Twitch</span>,
  Discord: () => <span>Discord</span>,
  Linkedin: () => <span>Linkedin</span>,
  Github: () => <span>Github</span>,
  Zap: () => <span>Zap</span>,
  Users: () => <span>Users</span>,
  TrendingUp: () => <span>TrendingUp</span>,
  Crown: () => <span>Crown</span>,
  Sparkles: () => <span>Sparkles</span>,
  Play: () => <span>Play</span>,
  Pause: () => <span>Pause</span>,
}));

// Mock SocialLinks component for Footer test
jest.mock('./components/creator/website/shared/SocialLinks', () => {
  return {
    __esModule: true,
    default: ({ links, variant, showLabels, className }) => {
      const platforms = Object.keys(links || {}).filter(key => links[key]);
      return (
        <div data-testid="social-links" className={className}>
          {platforms.map(platform => (
            <a
              key={platform}
              href={links[platform]}
              data-testid={`social-link-${platform}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {platform}
            </a>
          ))}
        </div>
      );
    },
  };
});

// Mock fetch
global.fetch = jest.fn();

// Mock window.scrollTo
window.scrollTo = jest.fn();
