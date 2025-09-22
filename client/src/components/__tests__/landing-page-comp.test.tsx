import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MarqueeWide from "../LandingPageComp/MarqueeWide";
import LeagueTable from "../LandingPageComp/LeagueTable";
import PremierLeagueTable from "../LandingPageComp/PremierLeagueTable";
import NewsCard from "../LandingPageComp/NewsCard";
import LiveMatchCard from "../LandingPageComp/LiveMatchCard";
import PastMatchCard from "../LandingPageComp/PastMatchCard";

import type { ScoreboardResponse } from "../../api/espn";

jest.mock("../../api/espn", () => {
  const actual = jest.requireActual("../../api/espn");
  return {
    ...actual,
    fetchScoreboard: jest.fn(),
    extractStatsFromScoreboardEvent: jest.fn(),
    fetchEplNews: jest.fn(),
    fetchEplStandings: jest.fn(),
  };
});

const { fetchScoreboard, extractStatsFromScoreboardEvent, fetchEplNews, fetchEplStandings } =
  jest.requireMock("../../api/espn");

const mockFetchScoreboard = fetchScoreboard as jest.MockedFunction<
  typeof import("../../api/espn").fetchScoreboard
>;
const mockExtractStats = extractStatsFromScoreboardEvent as jest.MockedFunction<
  typeof import("../../api/espn").extractStatsFromScoreboardEvent
>;
const mockFetchNews = fetchEplNews as jest.MockedFunction<
  typeof import("../../api/espn").fetchEplNews
>;
const mockFetchStandings = fetchEplStandings as jest.MockedFunction<
  typeof import("../../api/espn").fetchEplStandings
>;

function buildScoreboard(): ScoreboardResponse {
  const now = new Date();
  const dayBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  return {
    events: [
      {
        id: "evt-1",
        date: dayBefore,
        shortName: "FOO vs BAR",
        status: { type: { state: "post", detail: "FT", completed: true } },
        competitions: [
          {
            competitors: [
              {
                homeAway: "home",
                score: "2",
                team: {
                  shortDisplayName: "Foot",
                  logo: "home.png",
                  abbreviation: "FOO",
                },
                statistics: [
                  { name: "possession", value: 55 },
                  { name: "shotsOnTarget", value: 7 },
                ],
              },
              {
                homeAway: "away",
                score: "1",
                team: {
                  shortDisplayName: "Ball",
                  logo: "away.png",
                  abbreviation: "BAR",
                },
                statistics: [
                  { name: "possession", value: 45 },
                  { name: "shotsOnTarget", value: 3 },
                ],
              },
            ],
            details: [],
          },
        ],
      },
    ],
  };
}

beforeEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
  mockFetchScoreboard.mockResolvedValue(buildScoreboard());
  mockExtractStats.mockReturnValue({
    metrics: [
      { key: "poss", label: "Possession", homeVal: 55, awayVal: 45, homePct: 55 },
      { key: "shotsOnTarget", label: "Shots", homeVal: 7, awayVal: 3, homePct: 70 },
    ],
    saves: { home: 4, away: 2 },
    scorers: [
      { player: "Hero", minute: "45", teamAbbr: "FOO" },
      { player: "Late", minute: "90+2", teamAbbr: "BAR" },
    ],
  });
  mockFetchNews.mockResolvedValue({
    header: "Top stories",
    articles: [
      {
        type: "recap",
        headline: "Big win",
        description: "Summary",
        published: new Date().toISOString(),
        links: { web: { href: "https://example.com" } },
        images: [{ url: "image.png" }],
        byline: "Reporter",
        categories: [{ type: "recap", description: "Report" }],
      },
    ],
  } as any);
  mockFetchStandings.mockResolvedValue([
    {
      pos: 1,
      team: "Foot",
      p: 10,
      w: 8,
      d: 1,
      l: 1,
      gd: 12,
      pts: 25,
    },
  ] as any);
});

describe("Landing page components", () => {
  test("MarqueeWide repeats words for seamless scroll", () => {
    render(<MarqueeWide words={["Goal", "Assist"]} />);
    const spans = screen.getAllByText(/Goal|Assist/);
    expect(spans).toHaveLength(4);
  });

  test("LeagueTable renders provided rows", () => {
    render(
      <LeagueTable
        data={[
          { pos: 1, team: "Foot", played: 10, won: 8, drawn: 1, lost: 1, gd: "+10", pts: 25 },
        ]}
      />
    );

    const row = screen.getByText("Foot").closest("tr");
    expect(row).toBeTruthy();
    expect(row?.textContent).toContain("25");
  });

  test("PremierLeagueTable fetches and renders standings", async () => {
    render(<PremierLeagueTable season={2024} />);

    await waitFor(() =>
      expect(screen.getAllByRole("table")).not.toHaveLength(0)
    );
    expect(mockFetchStandings).toHaveBeenCalledWith({ season: 2024, level: 3 });
  });

  test("PremierLeagueTable shows error message", async () => {
    mockFetchStandings.mockRejectedValueOnce(new Error("bad"));
    render(<PremierLeagueTable />);

    await waitFor(() => expect(screen.getByText("bad")).toBeInTheDocument());
  });

  test("NewsCard shows articles and error state", async () => {
    const { rerender } = render(<NewsCard key="ok" />);

    await waitFor(() => screen.getByText("Big win"));
    expect(screen.getByText("Reporter")).toBeInTheDocument();

    mockFetchNews.mockRejectedValueOnce(new Error("boom"));
    rerender(<NewsCard key="err" />);

    await waitFor(() => screen.getByText("boom"));
  });

  test("LiveMatchCard renders fetched scoreboard", async () => {
    render(<LiveMatchCard showLabel />);

    await waitFor(() => screen.getByText(/Live now|Showing matches/));
    expect(screen.getByText("Foot")).toBeInTheDocument();
    expect(screen.getByText(/Hero/)).toBeInTheDocument();
  });

  test("PastMatchCard lists past results and supports navigation", async () => {
    const user = userEvent.setup();
    render(<PastMatchCard />);

    await waitFor(() => screen.getByText(/Matches/));
    await waitFor(() =>
      expect(screen.getAllByText(/Foot/).length).toBeGreaterThan(0)
    );

    await user.click(screen.getByRole("button", { name: "Previous day" }));
    expect(mockFetchScoreboard).toHaveBeenCalled();
  });
});
