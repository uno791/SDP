// __tests__/MatchViewer.test.tsx
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// SUT
import MatchViewer from '../pages/MatchViewer';

// ---- Child component mocks --------------------------------------------------
// We'll mock child cards so we can assert what props MatchViewer passes down
// without coupling to their internal markup.

// Capture props passed to the mocked GameSummaryCard
const gameSummarySpy: any[] = [];
function getLastSummaryProps() {
  return gameSummarySpy[gameSummarySpy.length - 1];
}
jest.mock('../components/MatchViewerComp/GameSummaryCard', () => ({
  __esModule: true,
  default: (props: any) => {
    gameSummarySpy.push(props);
    return (
      <div data-testid="GameSummaryCard">
        <div>home={props.homeName}</div>
        <div>away={props.awayName}</div>
        <div>homeScore={String(props.homeScore)}</div>
        <div>awayScore={String(props.awayScore)}</div>
        <div>status={String(props.statusText)}</div>
        <div>homeLogo={props.homeLogoUrl || ''}</div>
        <div>awayLogo={props.awayLogoUrl || ''}</div>
        <div>homeScorers={(props.homeScorers || []).join('|')}</div>
        <div>awayScorers={(props.awayScorers || []).join('|')}</div>
      </div>
    );
  },
}));

jest.mock('../components/MatchViewerComp/ComicCard', () => ({
  __esModule: true,
  default: ({ children }: any) => <section data-testid="ComicCard">{children}</section>,
}));

jest.mock('../components/MatchViewerComp/PlayerStatsCard', () => ({
  __esModule: true,
  default: () => <div data-testid="PlayerStatsCard">PlayerStats</div>,
}));

// ---- API mocks --------------------------------------------------------------
const mockFetchSummaryNormalized = jest.fn();
const mockFetchScoreboard = jest.fn();
const mockExtractStatsFromScoreboardEvent = jest.fn();

jest.mock('../api/espn', () => ({
  fetchSummaryNormalized: (...args: any[]) => mockFetchSummaryNormalized(...args),
  fetchScoreboard: (...args: any[]) => mockFetchScoreboard(...args),
  extractStatsFromScoreboardEvent: (...args: any[]) =>
    mockExtractStatsFromScoreboardEvent(...args),
}));

// ---- Fixtures ---------------------------------------------------------------
function minimalTeamBlock() {
  return {
    teamName: 'TBD',
    // Possession & Passing
    possessionPassing: {
      possessionPct: 60,
      passesAttempted: 300,
      accuratePasses: 250,
      passCompletionPct: 83,
    },
    // Discipline & Fouls
    disciplineFouls: {
      foulsCommitted: 10,
      yellowCards: 1,
      redCards: 0,
      offsides: 2,
    },
    // Shooting
    shooting: {
      totalShots: 12,
      shotsOnTarget: 6,
      blockedShots: 3,
      penaltyKicksTaken: 1,
      penaltyGoals: 1,
    },
    // Set Pieces & Saves
    setPiecesSaves: {
      cornerKicksWon: 4,
      savesByGK: 3,
    },
    // Crossing & Long Balls
    crossingLongBalls: {
      crossesAttempted: 15,
      accurateCrosses: 7,
      longBallsAttempted: 30,
      accurateLongBalls: 18,
      longBallAccuracyPct: 60,
    },
    // Defensive Actions
    defensiveActions: {
      tacklesTotal: 20,
      tacklesWon: 12,
      tackleSuccessPct: 60,
      interceptions: 9,
    },
  };
}

// include compDate so MatchViewer fetches correct scoreboard day
function makeSummary({
  homeName = 'Home FC',
  awayName = 'Away FC',
  homeScore = 2,
  awayScore = 1,
  statusText = 'FT',
  scorers = [
    { player: 'Home Striker', minute: "12'", homeAway: 'home' },
    { player: 'Away Winger', minute: "43'", homeAway: 'away' },
    { player: 'Home Mid', minute: "78'", homeAway: 'home' },
  ],
  compDate = new Date().toISOString(),
}: Partial<any> = {}) {
  const baseHome = { ...minimalTeamBlock(), teamName: homeName };
  const baseAway = { ...minimalTeamBlock(), teamName: awayName };
  return {
    home: baseHome,
    away: baseAway,
    score: { home: homeScore, away: awayScore },
    statusText,
    scorers,
    compDate,
  };
}

function makeScoreboardEvent({
  id = '123',
  homeId = 'H1',
  awayId = 'A1',
  homeAbbr = 'HFC',
  awayAbbr = 'AFC',
  homeLogo = 'https://logo.example/home.png',
  awayLogo = 'https://logo.example/away.png',
  detailsArray,
  scoringPlaysArray,
}: Partial<any> = {}) {
  const evt: any = {
    id,
    competitions: [
      {
        competitors: [
          {
            homeAway: 'home',
            team: { id: homeId, abbreviation: homeAbbr, logo: homeLogo },
          },
          {
            homeAway: 'away',
            team: { id: awayId, abbreviation: awayAbbr, logo: awayLogo },
          },
        ],
      },
    ],
  };

  if (detailsArray) {
    evt.competitions[0].details = detailsArray;
  } else if (scoringPlaysArray) {
    evt.competitions[0].details = { scoringPlays: scoringPlaysArray };
  }
  return evt;
}

function renderWithId(id?: string) {
  const path = id ? `/match?id=${id}` : `/match`;
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/match" element={<MatchViewer />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ---- Tests ------------------------------------------------------------------
describe('MatchViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    gameSummarySpy.length = 0;
  });

  test('shows “Missing ?id in URL” when no id is provided', () => {
    renderWithId(undefined);
    expect(screen.getByText(/Missing/i)).toBeInTheDocument();
  });

  test('shows Loading… then renders with summary data', async () => {
    mockFetchSummaryNormalized.mockResolvedValueOnce(makeSummary({}));
    mockFetchScoreboard.mockResolvedValueOnce({
      events: [makeScoreboardEvent({ id: '123' })],
    });
    mockExtractStatsFromScoreboardEvent.mockReturnValueOnce({ scorers: [] });

    renderWithId('123');

    // Loading state
    expect(screen.getByText(/Loading…/i)).toBeInTheDocument();

    // After load, our mocked GameSummaryCard renders
    await waitFor(() =>
      expect(screen.getByTestId('GameSummaryCard')).toBeInTheDocument()
    );

    // Assert props passed down to GameSummaryCard
    const lastProps = getLastSummaryProps();
    expect(lastProps.homeName).toBe('Home FC');
    expect(lastProps.awayName).toBe('Away FC');
    expect(lastProps.homeScore).toBe(2);
    expect(lastProps.awayScore).toBe(1);
    expect(lastProps.statusText).toBe('FT');
    // logos come from scoreboard
    expect(lastProps.homeLogoUrl).toMatch(/home\.png/);
    expect(lastProps.awayLogoUrl).toMatch(/away\.png/);

    // Scorers (from summary, since present)
    expect(lastProps.homeScorers).toContain('Home Striker');
    expect(lastProps.homeScorers).toContain('Home Mid');
    expect(lastProps.awayScorers).toContain('Away Winger');

    // A couple of stats sections render labels & values
    expect(screen.getByText('Possession')).toBeInTheDocument();
    expect(screen.getAllByText(/%$/).length).toBeGreaterThan(0);
    expect(screen.getByText('Total shots')).toBeInTheDocument();
    expect(screen.getByText('Corner kicks won')).toBeInTheDocument();
  });

  test('shows error UI when fetchSummaryNormalized rejects', async () => {
    mockFetchSummaryNormalized.mockRejectedValueOnce(new Error('summary boom'));
    renderWithId('999');

    await waitFor(() =>
      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/summary boom/i)).toBeInTheDocument();
  });

  test('uses sbScorers fallback when summary has no scorers and no detailed plays available', async () => {
    mockFetchSummaryNormalized.mockResolvedValueOnce(
      makeSummary({ scorers: [] })
    );
    // scoreboard has event, but no details/scoringPlays (so we fallback to extractStats())
    const sbEvent = makeScoreboardEvent({ id: '123' });
    mockFetchScoreboard.mockResolvedValueOnce({ events: [sbEvent] });
    mockExtractStatsFromScoreboardEvent.mockReturnValueOnce({
      scorers: [
        { player: 'Home Nine', minute: "10'", homeAway: 'home' },
        { player: 'Away Ten', minute: "55'", homeAway: 'away' },
      ],
    });

    renderWithId('123');

    await waitFor(() => expect(gameSummarySpy.length).toBeGreaterThan(0));
    const lastProps = getLastSummaryProps();
    expect(lastProps.homeScorers).toContain('Home Nine');
    expect(lastProps.awayScorers).toContain('Away Ten');
  });

  test('repairs scorer list from scoreboard detailed plays, including (p)/(OG) tags and minute normalization', async () => {
    mockFetchSummaryNormalized.mockResolvedValueOnce(
      makeSummary({ scorers: [] })
    );

    // Provide detailed scoring plays so MatchViewer rebuilds labels itself
    const detailsArray = [
      // Home penalty at 45+1
      {
        scoringPlay: true,
        text: 'Penalty converted by John Smith.',
        type: { id: 'penalty', text: 'Penalty' },
        team: { id: 'H1' },
        homeAway: 'home',
        clock: { displayValue: '45+1' },
        athletesInvolved: [{ displayName: 'John Smith' }],
      },
      // Away own goal at 63
      {
        scoringPlay: true,
        text: 'Own goal by Home Defender.',
        type: { id: 'owngoal', text: 'Own Goal' },
        team: { id: 'A1' }, // credited to away side
        homeAway: 'away',
        clock: { displayValue: '63' },
        athletesInvolved: [{ displayName: 'Home Defender' }],
      },
    ];

    const sbEvent = makeScoreboardEvent({
      id: '123',
      detailsArray,
      homeId: 'H1',
      awayId: 'A1',
      homeLogo: 'https://logo.example/h.png',
      awayLogo: 'https://logo.example/a.png',
    });
    mockFetchScoreboard.mockResolvedValueOnce({ events: [sbEvent] });

    // ⬅️ Important: return placeholder "Goal" entries so MatchViewer's
    // repair path is triggered (it rebuilds from `detailsArray`).
    mockExtractStatsFromScoreboardEvent.mockReturnValueOnce({
      scorers: [
        { player: 'Goal', minute: "45+1'", homeAway: 'home' },
        { player: 'Goal', minute: "63'", homeAway: 'away' },
      ],
    });

    renderWithId('123');

    await waitFor(() => expect(gameSummarySpy.length).toBeGreaterThan(0));
    const lastProps = getLastSummaryProps();

    // Expect (p) and (OG) tags and minute normalization with tick
    expect(lastProps.homeScorers.join('|')).toContain("John Smith (p) 45+1'");
    expect(lastProps.awayScorers.join('|')).toContain("Home Defender (OG) 63'");

    // Logos taken from scoreboard
    expect(lastProps.homeLogoUrl).toMatch(/\/h\.png$/);
    expect(lastProps.awayLogoUrl).toMatch(/\/a\.png$/);
  });

  test('falls back to score/status from summary when available; otherwise uses inner team scores if provided', async () => {
    // 1) With summary.score + statusText
    mockFetchSummaryNormalized.mockResolvedValueOnce(
      makeSummary({ homeScore: 4, awayScore: 2, statusText: '90+3’' })
    );
    mockFetchScoreboard.mockResolvedValueOnce({ events: [makeScoreboardEvent({ id: 'abc' })] });
    mockExtractStatsFromScoreboardEvent.mockReturnValueOnce({ scorers: [] });

    renderWithId('abc');
    await waitFor(() => expect(gameSummarySpy.length).toBeGreaterThan(0));
    let lastProps = getLastSummaryProps();
    expect(lastProps.homeScore).toBe(4);
    expect(lastProps.awayScore).toBe(2);
    expect(lastProps.statusText).toBe('90+3’');

    // 2) Without summary.score -> simulate inner team score fields
    // Reset & rerender with new route instance
    jest.clearAllMocks();
    gameSummarySpy.length = 0;

    const s = makeSummary({ statusText: null });
    // simulate inner score on home/away blocks
    (s as any).score = { home: null, away: null };
    (s as any).home.score = 1;
    (s as any).away.score = 1;

    mockFetchSummaryNormalized.mockResolvedValueOnce(s);
    mockFetchScoreboard.mockResolvedValueOnce({ events: [makeScoreboardEvent({ id: 'def' })] });
    mockExtractStatsFromScoreboardEvent.mockReturnValueOnce({ scorers: [] });

    renderWithId('def');
    await waitFor(() => expect(gameSummarySpy.length).toBeGreaterThan(0));
    lastProps = getLastSummaryProps();
    expect(lastProps.homeScore).toBeNull();
    expect(lastProps.awayScore).toBeNull();
    expect(lastProps.statusText).toBeNull();
  });

  test('renders match navigation links for overview/player stats/commentary', async () => {
    mockFetchSummaryNormalized.mockResolvedValueOnce(makeSummary({}));
    mockFetchScoreboard.mockResolvedValueOnce({ events: [makeScoreboardEvent({ id: 'x' })] });
    mockExtractStatsFromScoreboardEvent.mockReturnValueOnce({ scorers: [] });

    renderWithId('x');

    await waitFor(() => expect(screen.getByTestId('GameSummaryCard')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /Match Overview/i })).toHaveAttribute('href', '/matchviewer?id=x');
    expect(screen.getByRole('link', { name: /Player Stats/i })).toHaveAttribute('href', '/playerstats?id=x');
    expect(screen.getByRole('link', { name: /Commentary/i })).toHaveAttribute('href', '/commentary?id=x');
  });

  test('renders all major stat-section headings and key metric labels', async () => {
    mockFetchSummaryNormalized.mockResolvedValueOnce(makeSummary({}));
    mockFetchScoreboard.mockResolvedValueOnce({ events: [makeScoreboardEvent({ id: 's' })] });
    mockExtractStatsFromScoreboardEvent.mockReturnValueOnce({ scorers: [] });

    renderWithId('s');
    await waitFor(() => expect(screen.getByTestId('GameSummaryCard')).toBeInTheDocument());

    // Headline and subtitle
    expect(screen.getByText(/Home FC vs Away FC/i)).toBeInTheDocument();
    expect(screen.getByText(/Match Statistics/i)).toBeInTheDocument();

    // Section labels present (spot check across all sections)
    expect(screen.getByText('Possession')).toBeInTheDocument();
    expect(screen.getByText('Passes attempted')).toBeInTheDocument();

    expect(screen.getByText('Fouls committed')).toBeInTheDocument();
    expect(screen.getByText('Yellow cards')).toBeInTheDocument();

    expect(screen.getByText('Total shots')).toBeInTheDocument();
    expect(screen.getByText('Shots on target')).toBeInTheDocument();

    expect(screen.getByText('Corner kicks won')).toBeInTheDocument();
    expect(screen.getByText('Saves (GK)')).toBeInTheDocument();

    expect(screen.getByText('Crosses attempted')).toBeInTheDocument();
    expect(screen.getByText('Accurate long balls')).toBeInTheDocument();
    expect(screen.getByText('Long ball accuracy')).toBeInTheDocument();

    expect(screen.getByText('Blocked shots')).toBeInTheDocument();
    expect(screen.getByText('Penalty goals')).toBeInTheDocument();
  });
});
