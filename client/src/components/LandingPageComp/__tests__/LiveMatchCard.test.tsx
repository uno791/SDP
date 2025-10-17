import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LiveMatchCard from "../LiveMatchCard";
import type { ScoreboardResponse } from "@/api/espn";
import {
  fetchScoreboard as fetchScoreboardOriginal,
  extractStatsFromScoreboardEvent as extractStatsOriginal,
} from "@/api/espn";

jest.mock("@/api/espn", () => {
  const actual = jest.requireActual("@/api/espn");
  return {
    __esModule: true,
    ...actual,
    fetchScoreboard: jest.fn(),
    extractStatsFromScoreboardEvent: jest.fn(),
  };
});

const fetchScoreboard = fetchScoreboardOriginal as jest.MockedFunction<
  typeof fetchScoreboardOriginal
>;
const extractStatsFromScoreboardEvent =
  extractStatsOriginal as jest.MockedFunction<
    typeof extractStatsOriginal
  >;

const fixedNow = new Date("2024-04-15T10:00:00Z");

const makeScoreboard = (events: ScoreboardResponse["events"]) => ({ events });

const createEvent = ({
  id,
  date,
  state,
  detail,
  completed,
  home,
  away,
}: {
  id: string;
  date: string;
  state: "pre" | "in" | "post";
  detail?: string;
  completed: boolean;
  home: {
    shortDisplayName?: string;
    displayName?: string;
    name?: string;
    score?: string;
    logo?: string;
    logos?: Array<{ href?: string }>;
  };
  away: {
    shortDisplayName?: string;
    displayName?: string;
    name?: string;
    score?: string;
    logo?: string;
    logos?: Array<{ href?: string }>;
  };
}) => ({
  id,
  date,
  shortName: `${home.shortDisplayName ?? home.displayName ?? home.name ?? "-"} vs ${
    away.shortDisplayName ?? away.displayName ?? away.name ?? "-"
  }`,
  status: {
    type: { state, detail: detail as any, completed },
  },
  competitions: [
    {
      competitors: [
        {
          homeAway: "home" as const,
          score: home.score,
          team: {
            shortDisplayName: home.shortDisplayName,
            displayName: home.displayName,
            name: home.name,
            logo: home.logo,
            logos: home.logos,
          },
        },
        {
          homeAway: "away" as const,
          score: away.score,
          team: {
            shortDisplayName: away.shortDisplayName,
            displayName: away.displayName,
            name: away.name,
            logo: away.logo,
            logos: away.logos,
          },
        },
      ],
    },
  ],
});

describe("LiveMatchCard", () => {
  let dateTimeSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);
    fetchScoreboard.mockReset();
    extractStatsFromScoreboardEvent.mockReset();
    extractStatsFromScoreboardEvent.mockReturnValue({
      metrics: [
        { key: "poss", homeVal: 55, awayVal: 45, homePct: 55 },
        { key: "shots", homeVal: 10, awayVal: 8 },
      ],
      saves: [],
      scorers: [],
    });
    dateTimeSpy = jest
      .spyOn(Intl, "DateTimeFormat")
      .mockImplementation((locale: any, options: any) => {
        return {
          format: () => "19:30",
        } as Intl.DateTimeFormat;
      });
  });

  afterEach(() => {
    dateTimeSpy.mockRestore();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("falls back to previous day, formats times and uses team name/logo fallbacks", async () => {
    const todayIso = fixedNow.toISOString().slice(0, 10);
    const yesterdayIso = new Date(
      fixedNow.getFullYear(),
      fixedNow.getMonth(),
      fixedNow.getDate() - 1
    )
      .toISOString()
      .slice(0, 10);

    const emptyScoreboard = makeScoreboard([]);
    const scoreboardWithGames = makeScoreboard([
      createEvent({
        id: "match-pre",
        date: `${yesterdayIso}T18:00:00Z`,
        state: "pre",
        detail: "NotUsed",
        completed: false,
        home: {
          displayName: "Cape Town City",
          logos: [{ href: "home-logo.png" }],
        },
        away: {
          logos: [{}, { href: "away-second.png" }],
        },
      }),
      createEvent({
        id: "match-post",
        date: `${yesterdayIso}T15:00:00Z`,
        state: "post",
        detail: undefined,
        completed: true,
        home: {
          name: "Pirates",
          logo: "home-direct.png",
        },
        away: {
          shortDisplayName: "Chiefs",
        },
      }),
      createEvent({
        id: "match-pre",
        date: `${yesterdayIso}T18:00:00Z`,
        state: "pre",
        detail: "Duplicate",
        completed: false,
        home: {
          displayName: "Cape Town City",
          logos: [{ href: "home-logo.png" }],
        },
        away: {
          logos: [{}, { href: "away-second.png" }],
        },
      }),
    ]);

    fetchScoreboard.mockImplementation((date?: Date) => {
      if (!date) return Promise.resolve(emptyScoreboard);
      const iso = date.toISOString().slice(0, 10);
      if (iso === todayIso) return Promise.resolve(emptyScoreboard);
      if (iso === yesterdayIso) return Promise.resolve(scoreboardWithGames);
      return Promise.resolve(emptyScoreboard);
    });

    render(
      <MemoryRouter>
        <LiveMatchCard />
      </MemoryRouter>
    );

    expect(
      screen.getByText("Loading matches…")
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByText(/Showing matches for/i)
      ).toBeInTheDocument()
    );

    expect(
      screen.getByText(/Showing matches for/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/\d{4}-\d{2}-\d{2}/)).toBeInTheDocument();

    const cards = screen.getAllByRole("button", { hidden: true });
    expect(cards).toHaveLength(2);

    expect(screen.getAllByText("Cape Town City")[0]).toBeInTheDocument();
    expect(
      screen.getByAltText("Cape Town City")
    ).toHaveAttribute("src", "home-logo.png");
    expect(screen.getAllByText("Away")[0]).toBeInTheDocument();
    expect(screen.getByAltText("Away")).toHaveAttribute(
      "src",
      "away-second.png"
    );

    expect(screen.getByText("Pirates")).toBeInTheDocument();
    expect(
      screen.getByAltText("Pirates")
    ).toHaveAttribute("src", "home-direct.png");
    expect(screen.queryByAltText("Chiefs")).not.toBeInTheDocument();

    expect(screen.getAllByText("19:30")[0]).toBeInTheDocument();
    expect(screen.getAllByText("FT")[0]).toBeInTheDocument();

    const dtArgs = dateTimeSpy.mock.calls.map((call) => call[1]);
    expect(
      dtArgs.some(
        (opts) =>
          opts &&
          opts.timeZone === "Africa/Johannesburg" &&
          opts.hour === "2-digit" &&
          opts.minute === "2-digit"
      )
    ).toBe(true);
  });

  it("does not update state when initial fetch resolves after unmount", async () => {
    let resolveFn: ((value: ScoreboardResponse) => void) | null = null;
    const deferred = new Promise<ScoreboardResponse>((resolve) => {
      resolveFn = resolve;
    });
    fetchScoreboard.mockReturnValue(deferred);

    const { unmount } = render(
      <MemoryRouter>
        <LiveMatchCard />
      </MemoryRouter>
    );

    await waitFor(() => expect(fetchScoreboard).toHaveBeenCalled());

    unmount();

    await act(async () => {
      resolveFn?.(makeScoreboard([]));
      await deferred;
    });
  });
});
