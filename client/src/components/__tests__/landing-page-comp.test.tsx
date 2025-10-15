import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
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
    expect(mockFetchStandings).toHaveBeenCalledWith({ season: 2024, level: 3, league: "eng1" });
  });

  test("PremierLeagueTable shows error message", async () => {
    mockFetchStandings.mockRejectedValueOnce(new Error("bad"));
    render(<PremierLeagueTable />);

    await waitFor(() => expect(screen.getByText("bad")).toBeInTheDocument());
    expect(mockFetchStandings).toHaveBeenCalledWith({
      season: new Date().getFullYear(),
      level: 3,
      league: "eng1",
    });
  });

  test("NewsCard shows articles and error state", async () => {
    const { rerender } = render(<NewsCard key="ok" />);

    await waitFor(() => screen.getByText("Big win"));
    expect(screen.getByText("Reporter")).toBeInTheDocument();
    expect(mockFetchNews).toHaveBeenCalledWith("eng1");

    mockFetchNews.mockRejectedValueOnce(new Error("boom"));
    rerender(<NewsCard key="err" league="esp1" />);

    await waitFor(() => screen.getByText("boom"));
    expect(mockFetchNews).toHaveBeenLastCalledWith("esp1");
  });

  test("LiveMatchCard renders fetched scoreboard", async () => {
    render(
      <MemoryRouter>
        <LiveMatchCard showLabel />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText(/Match Statistics/));
    expect(screen.getByText("Foot")).toBeInTheDocument();
    expect(screen.getByText(/Hero/)).toBeInTheDocument();
    expect(mockFetchScoreboard).toHaveBeenCalled();
    const firstCall = mockFetchScoreboard.mock.calls[0];
    expect(firstCall[0]).toBeInstanceOf(Date);
    expect(firstCall[1]).toBe("eng1");

    const matchViewerLink = screen.getByRole("link", {
      name: /open match viewer/i,
    });
    expect(matchViewerLink).toHaveAttribute("href", "/matchviewer?id=evt-1");
  });

  test("LiveMatchCard forwards league prop to fetchScoreboard", async () => {
    mockFetchScoreboard.mockClear();

    render(
      <MemoryRouter>
        <LiveMatchCard showLabel league="esp1" />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockFetchScoreboard).toHaveBeenCalled());
    expect(mockFetchScoreboard.mock.calls[0][1]).toBe("esp1");
  });

  test("PastMatchCard lists past results and supports navigation", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PastMatchCard />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText(/Matches/));
    await waitFor(() =>
      expect(screen.getAllByText(/Foot/).length).toBeGreaterThan(0)
    );

    await user.click(screen.getByRole("button", { name: "Previous day" }));
    expect(mockFetchScoreboard).toHaveBeenCalled();
    expect(mockFetchScoreboard.mock.calls.some(([, league]) => league === "eng1")).toBe(true);
  });

  test("PastMatchCard forwards league prop to scoreboard fetch", async () => {
    mockFetchScoreboard.mockClear();

    render(
      <MemoryRouter>
        <PastMatchCard league="ita1" />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockFetchScoreboard).toHaveBeenCalled());
    for (const [, league] of mockFetchScoreboard.mock.calls) {
      expect(league).toBe("ita1");
    }
  });

  test("PastMatchCard expands completed matches but blocks upcoming fixtures", async () => {
    const now = new Date();
    const upcoming = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    const past = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

    const board: ScoreboardResponse = {
      events: [
        {
          id: "completed",
          date: past,
          shortName: "Done vs Finished",
          status: { type: { state: "post", detail: "FT", completed: true } },
          competitions: [
            {
              competitors: [
                {
                  homeAway: "home",
                  score: "1",
                  team: { shortDisplayName: "Done", logo: "done.png", abbreviation: "DON" },
                  statistics: [{ name: "possession", value: 60 }],
                },
                {
                  homeAway: "away",
                  score: "0",
                  team: { shortDisplayName: "Finished", logo: "fin.png", abbreviation: "FIN" },
                  statistics: [{ name: "possession", value: 40 }],
                },
              ],
              details: [],
            },
          ],
        },
        {
          id: "upcoming",
          date: upcoming,
          shortName: "Soon vs Later",
          status: { type: { state: "pre", detail: "20:00", completed: false } },
          competitions: [
            {
              competitors: [
                {
                  homeAway: "home",
                  score: "",
                  team: { shortDisplayName: "Soon", logo: "soon.png", abbreviation: "SOO" },
                },
                {
                  homeAway: "away",
                  score: "",
                  team: { shortDisplayName: "Later", logo: "latr.png", abbreviation: "LAT" },
                },
              ],
              details: [],
            },
          ],
        },
      ],
    };

    mockFetchScoreboard.mockResolvedValue(board);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PastMatchCard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Done/)).toBeInTheDocument());

    const cardButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Done") || btn.textContent?.includes("Soon"));

    const completedCard = cardButtons.find((btn) => btn.textContent?.includes("Done"))!;
    const upcomingCard = cardButtons.find((btn) => btn.textContent?.includes("Soon"))!;

    await user.click(completedCard);
    expect(await screen.findByText(/Scorers/)).toBeInTheDocument();

    await user.click(upcomingCard);
    expect(screen.queryByLabelText(/Open Match Viewer for match upcoming/i)).not.toBeInTheDocument();
  });

  test("PastMatchCard shows kickoff info when no match stats are returned", async () => {
    const now = new Date();
    const board: ScoreboardResponse = {
      events: [
        {
          id: "nostats",
          date: now.toISOString(),
          shortName: "Alpha vs Beta",
          status: { type: { state: "post", detail: "FT", completed: true } },
          competitions: [
            {
              competitors: [
                {
                  homeAway: "home",
                  score: "2",
                  team: { shortDisplayName: "Alpha", logo: "" },
                },
                {
                  homeAway: "away",
                  score: "1",
                  team: { shortDisplayName: "Beta", logo: "" },
                },
              ],
              details: [],
            },
          ],
        },
      ],
    };

    mockFetchScoreboard.mockReset();
    mockFetchScoreboard.mockResolvedValue(board);
    mockExtractStats.mockReturnValue({ metrics: [], saves: {}, scorers: [] });

    const { container } = render(
      <MemoryRouter>
        <PastMatchCard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Alpha/)).toBeInTheDocument());

    const matchCard = Array.from(container.querySelectorAll('[role="button"]')).find((btn) =>
      btn.textContent?.includes("Alpha")
    );
    expect(matchCard).toBeTruthy();

    if (!matchCard) return;

    fireEvent.keyDown(matchCard, { key: "Enter", code: "Enter" });

    await waitFor(() =>
      expect(screen.getByText(/Kickoff/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Open Match Viewer/)).toBeInTheDocument();
  });

  test("PastMatchCard triggers the native picker fallback and handles manual date entry", async () => {
    const { container } = render(
      <MemoryRouter>
        <PastMatchCard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Matches/)).toBeInTheDocument());

    const dateLabel = container.querySelector('.dateLabel') as HTMLElement;
    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dateLabel).toBeTruthy();
    expect(dateInput).toBeTruthy();

    if (!dateLabel || !dateInput) return;

    const clickSpy = jest.spyOn(dateInput, "click");

    fireEvent.keyDown(dateLabel, { key: "Enter", code: "Enter" });
    expect(clickSpy).toHaveBeenCalled();

    const beforeCalls = mockFetchScoreboard.mock.calls.length;

    fireEvent.change(dateInput, { target: { value: "2024-01-02" } });

    await waitFor(() =>
      expect(mockFetchScoreboard.mock.calls.length).toBeGreaterThan(beforeCalls)
    );

    clickSpy.mockRestore();
  });
});
