import React from "react";
import {
  act,
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import FavouriteTeamMatches from "../FavouriteTeamMatches";
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

const mockMatchCard = jest.fn(
  ({
    id,
    home,
    away,
    statusText,
  }: {
    id: string;
    home: { name: string; score: string | number | undefined; logo?: string };
    away: { name: string; score: string | number | undefined; logo?: string };
    statusText: string;
  }) => (
    <div data-testid="match-card">
      <span data-testid={`card-${id}-home`}>{home.name}</span>
      <span data-testid={`card-${id}-away`}>{away.name}</span>
      <span data-testid={`card-${id}-status`}>{statusText}</span>
    </div>
  )
);

jest.mock("@/components/HomePageComp/MatchCard/MatchCard", () => ({
  __esModule: true,
  default: (props: any) => mockMatchCard(props),
}));

const fetchScoreboard = fetchScoreboardOriginal as jest.MockedFunction<
  typeof fetchScoreboardOriginal
>;
const extractStatsFromScoreboardEvent =
  extractStatsOriginal as jest.MockedFunction<
    typeof extractStatsOriginal
  >;

const fixedNow = new Date("2024-04-15T12:00:00Z");

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
    displayName?: string;
    name?: string;
    shortDisplayName?: string;
    score?: string;
    logo?: string;
    logos?: Array<{ href?: string }>;
  };
  away: {
    displayName?: string;
    name?: string;
    shortDisplayName?: string;
    score?: string;
    logo?: string;
    logos?: Array<{ href?: string }>;
  };
}) => ({
  id,
  date,
  shortName: `${home.shortDisplayName ?? home.name ?? "-"} vs ${
    away.shortDisplayName ?? away.name ?? "-"
  }`,
  status: {
    type: { state, detail, completed },
  },
  competitions: [
    {
      competitors: [
        {
          homeAway: "home" as const,
          score: home.score ?? undefined,
          team: {
            shortDisplayName:
              home.shortDisplayName ??
              home.displayName ??
              home.name ??
              "",
            displayName: home.displayName ?? home.name,
            name: home.name,
            logo: home.logo,
            logos: home.logos,
          },
        },
        {
          homeAway: "away" as const,
          score: away.score ?? undefined,
          team: {
            shortDisplayName:
              away.shortDisplayName ??
              away.displayName ??
              away.name ??
              "",
            displayName: away.displayName ?? away.name,
            name: away.name,
            logo: away.logo,
            logos: away.logos,
          },
        },
      ],
    },
  ],
});

describe("FavouriteTeamMatches", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);
    fetchScoreboard.mockReset();
    extractStatsFromScoreboardEvent.mockReset();
    extractStatsFromScoreboardEvent.mockReturnValue({
      metrics: [],
      saves: undefined,
      scorers: [],
    });
    mockMatchCard.mockClear();
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("filters completed events for matching teams and sorts by kickoff", async () => {
    const todayIso = fixedNow.toISOString().slice(0, 10);
    const pastEvents = makeScoreboard([
      createEvent({
        id: "matching-later",
        date: `${todayIso}T18:00:00Z`,
        state: "post",
        detail: "FT",
        completed: true,
        home: { shortDisplayName: "Lions", name: "Lions", score: "2" },
        away: { name: "Tigers", score: "1" },
      }),
      createEvent({
        id: "matching-earlier",
        date: `${todayIso}T14:00:00Z`,
        state: "post",
        detail: undefined,
        completed: true,
        home: { shortDisplayName: "Lions", name: "Lions", score: "3" },
        away: { name: "Bears", score: "0" },
      }),
      createEvent({
        id: "non-favourite",
        date: `${todayIso}T12:00:00Z`,
        state: "post",
        detail: "FT",
        completed: true,
        home: { shortDisplayName: "Others", name: "Others", score: "1" },
        away: { name: "Rivals", score: "1" },
      }),
    ]);
    const maybeTeam =
      pastEvents.events?.[1]?.competitions?.[0]?.competitors?.[1]?.team;
    if (maybeTeam) {
      (maybeTeam as any).shortDisplayName = undefined;
    }

    fetchScoreboard.mockResolvedValue(pastEvents);

    render(<FavouriteTeamMatches teamNames={[" Lions ", "Bears"]} />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => expect(mockMatchCard).toHaveBeenCalledTimes(2));

    const firstCall = mockMatchCard.mock.calls[0][0];
    const secondCall = mockMatchCard.mock.calls[1][0];

    expect(firstCall.id).toBe("matching-earlier");
    expect(secondCall.id).toBe("matching-later");

    expect(
      screen.getByTestId("card-matching-earlier-home")
    ).toHaveTextContent("Lions");
    expect(
      screen.getByTestId("card-matching-earlier-away")
    ).toHaveTextContent("-");
    expect(
      screen.getByTestId("card-matching-earlier-status")
    ).toHaveTextContent("FT");

    expect(fetchScoreboard).toHaveBeenCalled();
    expect(extractStatsFromScoreboardEvent).toHaveBeenCalled();
  });

  it("shows upcoming events when viewing a future date", async () => {
    const todayIso = fixedNow.toISOString().slice(0, 10);
    const futureIso = new Date(
      fixedNow.getFullYear(),
      fixedNow.getMonth(),
      fixedNow.getDate() + 1
    )
      .toISOString()
      .slice(0, 10);

    const pastEvents = makeScoreboard([
      createEvent({
        id: "past",
        date: `${todayIso}T15:00:00Z`,
        state: "post",
        detail: "FT",
        completed: true,
        home: { shortDisplayName: "Sharks", name: "Sharks", score: "1" },
        away: { shortDisplayName: "Jets", name: "Jets", score: "1" },
      }),
    ]);

    const futureEvents = makeScoreboard([
      createEvent({
        id: "upcoming",
        date: `${futureIso}T18:30:00Z`,
        state: "pre",
        detail: "ShouldNotBeUsed",
        completed: false,
        home: { shortDisplayName: "Sharks", name: "Sharks" },
        away: { shortDisplayName: "Jets", name: "Jets" },
      }),
    ]);

    const baseDate = new Date(
      fixedNow.getFullYear(),
      fixedNow.getMonth(),
      fixedNow.getDate()
    );
    const futureDate = new Date(
      fixedNow.getFullYear(),
      fixedNow.getMonth(),
      fixedNow.getDate() + 1
    );

    fetchScoreboard.mockImplementation((date?: Date) => {
      const target = date
        ? new Date(date.getFullYear(), date.getMonth(), date.getDate())
        : baseDate;
      if (target.getTime() === futureDate.getTime()) {
        return Promise.resolve(futureEvents);
      }
      return Promise.resolve(pastEvents);
    });

    render(<FavouriteTeamMatches teamNames={["Sharks", "Jets"]} />);

    await waitFor(() => expect(mockMatchCard).toHaveBeenCalledTimes(1));

    mockMatchCard.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Next day" }));

    await waitFor(() =>
      expect(mockMatchCard).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "upcoming",
        })
      )
    );

    const call = mockMatchCard.mock.calls[0][0];
    expect(call.statusText).not.toBe("ShouldNotBeUsed");
    expect(call.statusText).toMatch(/\d{1,2}:\d{2}/);
  });

  it("shows error message when scoreboard fetch fails", async () => {
    fetchScoreboard.mockRejectedValue(new Error("boom"));

    render(<FavouriteTeamMatches teamNames={["Falcons"]} />);

    await waitFor(() =>
      expect(screen.getByText("boom")).toBeInTheDocument()
    );
    expect(screen.queryAllByTestId("match-card")).toHaveLength(0);
  });

  it("resets to base date when no favourite fixtures found", async () => {
    fetchScoreboard.mockResolvedValue(makeScoreboard([]));

    render(<FavouriteTeamMatches teamNames={["Whales"]} />);

    await waitFor(() =>
      expect(
        screen.getByText("No favourite team matches.")
      ).toBeInTheDocument()
    );
    expect(fetchScoreboard).toHaveBeenCalled();
  });

  it("stops state updates when unmounted mid fetch", async () => {
    let resolveFn: ((value: ScoreboardResponse) => void) | null = null;
    const deferred = new Promise<ScoreboardResponse>((resolve) => {
      resolveFn = resolve;
    });
    fetchScoreboard.mockReturnValue(deferred);

    const { unmount } = render(
      <FavouriteTeamMatches teamNames={["Panthers"]} />
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => expect(fetchScoreboard).toHaveBeenCalled());

    unmount();

    await act(async () => {
      resolveFn?.(makeScoreboard([]));
      await deferred;
    });

    expect(mockMatchCard).not.toHaveBeenCalled();
  });
});
