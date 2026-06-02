import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TemplateRenderer from '../creator/TemplateRenderer';

// Mock all 7 STEEZE components
jest.mock('../creator/YOURSTEEZE/IconSteeze', () => ({
  __esModule: true,
  default: ({ 
  creator, 
  isCreator, 
  previewAsFan, 
  followStatus, 
  onFollow, 
  isFollowLoading 
}: { 
  creator: any; 
  isCreator: boolean; 
  previewAsFan: boolean; 
  followStatus: boolean; 
  onFollow?: () => void; 
  isFollowLoading: boolean; 
}) => (
    <div data-testid="icon-steeze">
      IconSteeze - {creator?.artistName || 'No Artist'}
      {isCreator && <span data-testid="is-creator">Creator Mode</span>}
      {previewAsFan && <span data-testid="preview-mode">Preview as Fan</span>}
      {followStatus && <span data-testid="follow-status">Following</span>}
      {onFollow && <button data-testid="follow-button" onClick={() => onFollow()}>Follow</button>}
      {isFollowLoading && <span data-testid="follow-loading">Loading...</span>}
    </div>
  ),
}));

jest.mock('../creator/YOURSTEEZE/RebelSteeze', () => ({
  __esModule: true,
  default: () => <div data-testid="rebel-steeze">RebelSteeze</div>,
}));

jest.mock('../creator/YOURSTEEZE/DivaSteeze', () => ({
  __esModule: true,
  default: () => <div data-testid="diva-steeze">DivaSteeze</div>,
}));

jest.mock('../creator/YOURSTEEZE/VisionarySteeze', () => ({
  __esModule: true,
  default: () => <div data-testid="visionary-steeze">VisionarySteeze</div>,
}));

jest.mock('../creator/YOURSTEEZE/PureSteeze', () => ({
  __esModule: true,
  default: () => <div data-testid="pure-steeze">PureSteeze</div>,
}));

jest.mock('../creator/YOURSTEEZE/SpectrumSteeze', () => ({
  __esModule: true,
  default: () => <div data-testid="spectrum-steeze">SpectrumSteeze</div>,
}));

jest.mock('../creator/YOURSTEEZE/LuminarySteeze', () => ({
  __esModule: true,
  default: () => <div data-testid="luminary-steeze">LuminarySteeze</div>,
}));

const mockCreator = {
  artistName: 'Test Artist',
  username: 'testartist',
  _count: {
    followers: 1000,
    following: 500,
    posts: 250,
  },
};

describe('TemplateRenderer Component', () => {
  const defaultProps = {
    creator: mockCreator,
    isCreator: false,
    previewAsFan: false,
    followStatus: false,
    onFollow: jest.fn(),
    isFollowLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering by templateId', () => {
    it('renders IconSteeze by default when no templateId provided', () => {
      render(<TemplateRenderer {...defaultProps} />);
      expect(screen.getByTestId('icon-steeze')).toBeInTheDocument();
    });

    it('renders IconSteeze when templateId is "icon"', () => {
      render(<TemplateRenderer {...defaultProps} templateId="icon" />);
      expect(screen.getByTestId('icon-steeze')).toBeInTheDocument();
    });

    it('renders RebelSteeze when templateId is "rebel"', () => {
      render(<TemplateRenderer {...defaultProps} templateId="rebel" />);
      expect(screen.getByTestId('rebel-steeze')).toBeInTheDocument();
    });

    it('renders DivaSteeze when templateId is "diva"', () => {
      render(<TemplateRenderer {...defaultProps} templateId="diva" />);
      expect(screen.getByTestId('diva-steeze')).toBeInTheDocument();
    });

    it('renders VisionarySteeze when templateId is "visionary"', () => {
      render(<TemplateRenderer {...defaultProps} templateId="visionary" />);
      expect(screen.getByTestId('visionary-steeze')).toBeInTheDocument();
    });

    it('renders PureSteeze when templateId is "pure"', () => {
      render(<TemplateRenderer {...defaultProps} templateId="pure" />);
      expect(screen.getByTestId('pure-steeze')).toBeInTheDocument();
    });

    it('renders SpectrumSteeze when templateId is "spectrum"', () => {
      render(<TemplateRenderer {...defaultProps} templateId="spectrum" />);
      expect(screen.getByTestId('spectrum-steeze')).toBeInTheDocument();
    });

    it('renders LuminarySteeze when templateId is "luminary"', () => {
      render(<TemplateRenderer {...defaultProps} templateId="luminary" />);
      expect(screen.getByTestId('luminary-steeze')).toBeInTheDocument();
    });

    it('falls back to IconSteeze for unknown templateId', () => {
      render(<TemplateRenderer {...defaultProps} templateId="unknown" />);
      expect(screen.getByTestId('icon-steeze')).toBeInTheDocument();
    });
  });

  describe('Props passing', () => {
    it('passes creator prop to the rendered STEEZE', () => {
      render(<TemplateRenderer {...defaultProps} templateId="icon" />);
      expect(screen.getByText(/Test Artist/)).toBeInTheDocument();
    });

    it('passes isCreator=true when creator mode enabled', () => {
      render(<TemplateRenderer {...defaultProps} isCreator={true} templateId="icon" />);
      expect(screen.getByTestId('is-creator')).toBeInTheDocument();
    });

    it('passes previewAsFan=true when fan preview mode enabled', () => {
      render(<TemplateRenderer {...defaultProps} previewAsFan={true} templateId="icon" />);
      expect(screen.getByTestId('preview-mode')).toBeInTheDocument();
    });

    it('passes followStatus=true when user is following', () => {
      render(<TemplateRenderer {...defaultProps} followStatus={true} templateId="icon" />);
      expect(screen.getByTestId('follow-status')).toBeInTheDocument();
    });

    it('passes onFollow callback to the rendered STEEZE', () => {
      const mockOnFollow = jest.fn();
      render(<TemplateRenderer {...defaultProps} onFollow={mockOnFollow} templateId="icon" />);
      const followButton = screen.getByTestId('follow-button');
      followButton.click();
      expect(mockOnFollow).toHaveBeenCalled();
    });

    it('passes isFollowLoading=true when follow is loading', () => {
      render(<TemplateRenderer {...defaultProps} isFollowLoading={true} templateId="icon" />);
      expect(screen.getByTestId('follow-loading')).toBeInTheDocument();
    });
  });

  describe('All 7 STEEZE are supported', () => {
    const steezeIds = ['icon', 'rebel', 'diva', 'visionary', 'pure', 'spectrum', 'luminary'];
    const expectedTestIds = [
      'icon-steeze',
      'rebel-steeze',
      'diva-steeze',
      'visionary-steeze',
      'pure-steeze',
      'spectrum-steeze',
      'luminary-steeze',
    ];

    steezeIds.forEach((id, index) => {
      it(`renders ${id} when templateId is "${id}"`, () => {
        render(<TemplateRenderer {...defaultProps} templateId={id} />);
        expect(screen.getByTestId(expectedTestIds[index])).toBeInTheDocument();
      });
    });
  });
});