import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock SocialLinks BEFORE importing Footer
jest.mock('../creator/website/shared/SocialLinks', () => {
  return function MockedSocialLinks() {
    return <div data-testid="social-links">SocialLinks Mock</div>;
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowUp: () => <span data-testid="arrow-up-icon">ArrowUp</span>,
}));

// Mock window.scrollTo
window.scrollTo = jest.fn();

import Footer from '../creator/website/shared/Footer';

describe('Footer Component', () => {
  const mockProps = {
    artistName: 'Test Artist',
    templateId: 'icon',
    socialLinks: {
      instagram: 'https://instagram.com/test',
      twitter: 'https://twitter.com/test',
      youtube: 'https://youtube.com/test',
    },
    theme: {
      borderColor: 'border-gold/30',
      accentColor: 'text-gold',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders footer component without crashing', () => {
      render(<Footer {...mockProps} />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('renders copyright text with current year', () => {
      const currentYear = new Date().getFullYear();
      render(<Footer {...mockProps} />);
      expect(screen.getAllByText(new RegExp(`© ${currentYear} Test Artist · ICON STEEZE`)).length).toBeGreaterThan(0);
    });

    it('renders navigation links', () => {
      render(<Footer {...mockProps} />);
      expect(screen.getAllByText('Privacy').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Terms').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Contact').length).toBeGreaterThan(0);
      expect(screen.getAllByText('About').length).toBeGreaterThan(0);
    });

    it('renders social links when provided', () => {
      render(<Footer {...mockProps} />);
      // SocialLinks mock renders in both desktop and mobile layouts
      const socialLinksMocks = screen.getAllByTestId('social-links');
      expect(socialLinksMocks.length).toBe(2);
      expect(socialLinksMocks[0]).toBeInTheDocument();
    });

    it('does not render social section when no social links', () => {
      const propsWithoutSocial = {
        ...mockProps,
        socialLinks: {},
      };
      render(<Footer {...propsWithoutSocial} />);
      // Should not have social links mock rendered
      const socialLinksMock = screen.queryByTestId('social-links');
      expect(socialLinksMock).not.toBeInTheDocument();
    });
  });

  describe('Template ID Mapping', () => {
    const templates = [
      { id: 'icon', display: 'ICON' },
      { id: 'rebel', display: 'REBEL' },
      { id: 'diva', display: 'DIVA' },
      { id: 'visionary', display: 'VISIONARY' },
      { id: 'pure', display: 'PURE' },
      { id: 'spectrum', display: 'SPECTRUM' },
      { id: 'luminary', display: 'LUMINARY' },
    ];

    templates.forEach(({ id, display }) => {
      it(`displays correct template name for ${id}`, () => {
        const currentYear = new Date().getFullYear();
        render(<Footer {...mockProps} templateId={id} />);
        expect(screen.getAllByText(new RegExp(`© ${currentYear} Test Artist · ${display} STEEZE`)).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Back to Top Button', () => {
    it('does not show back to top button initially', () => {
      render(<Footer {...mockProps} />);
      const backToTopButton = screen.queryByLabelText('Back to top');
      expect(backToTopButton).not.toBeInTheDocument();
    });

    it('shows back to top button after scrolling past 300px', () => {
      render(<Footer {...mockProps} />);

      // Simulate scroll past 300px
      fireEvent.scroll(window, { target: { scrollY: 350 } });

      const backToTopButton = screen.getByLabelText('Back to top');
      expect(backToTopButton).toBeInTheDocument();
    });

    it('hides back to top button when scroll is less than 300px', () => {
      render(<Footer {...mockProps} />);

      // Simulate scroll past 300px then back up
      fireEvent.scroll(window, { target: { scrollY: 350 } });
      fireEvent.scroll(window, { target: { scrollY: 200 } });

      const backToTopButton = screen.queryByLabelText('Back to top');
      expect(backToTopButton).not.toBeInTheDocument();
    });

    it('scrolls to top when clicked', () => {
      render(<Footer {...mockProps} />);

      // Show button by scrolling
      fireEvent.scroll(window, { target: { scrollY: 350 } });

      const backToTopButton = screen.getByLabelText('Back to top');
      fireEvent.click(backToTopButton);

      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    });
  });

  describe('Theme Application', () => {
    it('applies custom border color from theme', () => {
      render(<Footer {...mockProps} />);
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('border-gold/30');
    });

    it('applies default border color when theme not provided', () => {
      const propsWithoutTheme = {
        artistName: 'Test Artist',
        templateId: 'icon',
        socialLinks: {},
      };
      render(<Footer {...propsWithoutTheme} />);
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('border-gray-800');
    });
  });

  describe('Fallback Values', () => {
    it('uses "Creator" as fallback when artistName is empty', () => {
      const currentYear = new Date().getFullYear();
      render(<Footer {...mockProps} artistName="" />);
      expect(screen.getAllByText(new RegExp(`© ${currentYear} Creator · ICON STEEZE`)).length).toBeGreaterThan(0);
    });

    it('uses "ICON" as fallback when templateId is invalid', () => {
      const currentYear = new Date().getFullYear();
      render(<Footer {...mockProps} templateId="invalid" />);
      expect(screen.getAllByText(new RegExp(`© ${currentYear} Test Artist · ICON STEEZE`)).length).toBeGreaterThan(0);
    });
  });

  describe('Navigation Links', () => {
    it('navigation links have correct href attributes', () => {
      render(<Footer {...mockProps} />);

      const desktopPrivacy = screen.getAllByText('Privacy')[0];
      const desktopTerms = screen.getAllByText('Terms')[0];
      const desktopContact = screen.getAllByText('Contact')[0];
      const desktopAbout = screen.getAllByText('About')[0];

      expect(desktopPrivacy.closest('a')).toHaveAttribute('href', '/privacy');
      expect(desktopTerms.closest('a')).toHaveAttribute('href', '/terms');
      expect(desktopContact.closest('a')).toHaveAttribute('href', '/contact');
      expect(desktopAbout.closest('a')).toHaveAttribute('href', '/about');
    });
  });

  describe('Error Handling', () => {
    it('gracefully handles missing social links', () => {
      const propsWithoutSocial = {
        artistName: 'Test Artist',
        templateId: 'icon',
        socialLinks: undefined,
      };
      expect(() => render(<Footer {...propsWithoutSocial} />)).not.toThrow();
    });

    it('continues rendering even if social links have invalid data', () => {
      const propsWithInvalidSocial = {
        ...mockProps,
        socialLinks: {
          instagram: '',
          twitter: '',
          youtube: '',
        },
      };
      expect(() => render(<Footer {...propsWithInvalidSocial} />)).not.toThrow();
    });

    it('catches render error, logs it, sets hasError and returns null (covers lines 154-156 and 75)', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // theme.borderColor is used in a template literal at line 81 inside the try block:
      //   className={`w-full border-t ${borderColor} py-8 md:py-12`}
      // Template literal evaluation calls .toString() on `borderColor` synchronously
      // inside the try — Footer's own catch will fire (lines 153-156).
      // After setHasError(true), re-render hits line 75 → returns null.
      render(
        <Footer
          {...mockProps}
          socialLinks={{}}
          theme={{
            borderColor: {
              toString() {
                throw new Error('Simulated render error');
              },
            } as any,
          }}
        />,
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Footer failed to render:',
        expect.any(Error),
      );
      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('handles missing templateId gracefully', () => {
      const propsWithoutTemplateId = {
        artistName: 'Test Artist',
        templateId: undefined as any,
        socialLinks: {},
      };
      render(<Footer {...propsWithoutTemplateId} />);
      // Should default to ICON STEEZE (desktop + mobile = two matching elements)
      const currentYear = new Date().getFullYear();
      const elements = screen.getAllByText(new RegExp(`© ${currentYear} Test Artist · ICON STEEZE`));
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('handles window.scrollTo during back to top click when already at top', () => {
      window.scrollY = 0;
      render(<Footer {...mockProps} />);
      // Back to top button should not be visible at scrollY=0
      const backToTopButton = screen.queryByLabelText('Back to top');
      expect(backToTopButton).not.toBeInTheDocument();
    });
  });
});