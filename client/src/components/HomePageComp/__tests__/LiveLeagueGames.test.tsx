import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LiveLeagueGames from "../LiveLeagueGames/LiveLeagueGames";
import { fetchScoreboard, extractStatsFromScoreboardEvent } from "../../../api/espn";

jest.mock("../../../api/espn", () => ({
  fetchScoreboard: jest.fn(),
  extractStatsFromScoreboardEvent: jest.fn(),
}));

const mockFetch = fetchScoreboard as jest.MockedFunction<typeof fetchScoreboard>;
const mockExtract = extractStatsFromScoreboardEvent as jest.MockedFunction<
  typeof extractStatsFromScoreboardEvent
>;

const matchCardSpy = jest.fn();
jest.mock("../MatchCard/MatchCard", () => (props: any) => {
  matchCardSpy(props);
  return (
    <div data-testid="match-card">
      {props.home.name} {props.home.score} - {props.away.score} {props.away.name}
    </div>
  );
});

describe("LiveLeagueGames", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    matchCardSpy.mockClear();
    mockExtract.mockReturnValue({ metrics: [], scorers: [] } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const liveEvent = {
    id: "1",
    date: new Date().toISOString(),
    status: { type: { state: "in", detail: "45'", completed: false } },
    competitions: [
      {
        competitors: [
          {
            homeAway: "home",
            score: "2",
            team: { shortDisplayName: "Arsenal", logo: "home.png" },
          },
          {
            homeAway: "away",
            score: "1",
            team: { shortDisplayName: "Spurs", logo: "away.png" },
          },
        ],
      },
    ],
  };

  test("renders live matches and schedules fast polling when in play", async () => {
    mockFetch.mockResolvedValueOnce({ events: [liveEvent] } as any);
    mockExtract.mockReturnValueOnce({
      metrics: [],
      saves: undefined,
      scorers: [
        { player: "Smith (OG)", minute: "12'" },
        { player: "Jones (P)", minute: "33'" },
      ],
    } as any);

    const setTimeoutSpy = jest.spyOn(window, "setTimeout");

    const { container } = render(<LiveLeagueGames />);

    await waitFor(() => expect(matchCardSpy).toHaveBeenCalled());

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("match-card")).toHaveTextContent(/Arsenal 2 - 1 Spurs/);

    const scorers = matchCardSpy.mock.calls[0]?.[0]?.scorers;
    expect(scorers.map((s: any) => s.player)).toEqual(["Smith (OG)", "Jones (p)"]);

    const badge = container.querySelector("[data-live]") as HTMLElement;
    expect(badge).toHaveAttribute("data-live", "yes");

    const delays = setTimeoutSpy.mock.calls
      .map(([, delay]) => delay)
      .filter((delay): delay is number => typeof delay === "number");
    expect(delays).toContain(10_000);

    setTimeoutSpy.mockRestore();
  });

  test("shows fallback when no live or upcoming matches", async () => {
    mockFetch.mockResolvedValueOnce({
      events: [
        {
          ...liveEvent,
          status: { type: { state: "post", detail: "FT", completed: true } },
        },
      ],
    } as any);

    render(<LiveLeagueGames />);

    await waitFor(() =>
      expect(screen.getByText(/No live or upcoming games today/i)).toBeInTheDocument()
    );
  });

  test("displays error state when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("scoreboard down"));

    render(<LiveLeagueGames />);

    await waitFor(() => expect(screen.getByText(/scoreboard down/i)).toBeInTheDocument());
  });
});
