import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import PastLeagueGames from "../PastLeagueGames/PastLeagueGames";
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
  return <div data-testid="match-card">{props.home.name} vs {props.away.name}</div>;
});

describe("PastLeagueGames", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    matchCardSpy.mockClear();
    mockExtract.mockReturnValue({ metrics: [], scorers: [] } as any);
  });

  const makeEvent = (state: "pre" | "in" | "post") => ({
    id: state,
    date: new Date().toISOString(),
    status: {
      type: {
        state,
        detail: state === "post" ? "FT" : "8:00 PM",
        completed: state === "post",
      },
    },
    competitions: [
      {
        competitors: [
          {
            homeAway: "home",
            score: state === "pre" ? "-" : "2",
            team: { shortDisplayName: "Chelsea", logo: "c.png" },
          },
          {
            homeAway: "away",
            score: state === "pre" ? "-" : "0",
            team: { shortDisplayName: "Villa", logo: "v.png" },
          },
        ],
      },
    ],
  });

  test("renders completed matches using scoreboard data", async () => {
    mockFetch.mockResolvedValueOnce({ events: [makeEvent("post")] } as any);
    mockExtract.mockReturnValueOnce({
      metrics: [{ key: "poss", label: "Poss", homeVal: 55, awayVal: 45 }],
      scorers: [],
    } as any);

    render(<PastLeagueGames />);

    await waitFor(() => expect(matchCardSpy).toHaveBeenCalled());

    const props = matchCardSpy.mock.calls[0]?.[0];
    expect(props.statusText).toBe("FT");
    expect(props.state).toBe("post");
    expect(screen.getByTestId("match-card")).toHaveTextContent(/Chelsea vs Villa/);
  });

  test("shows finished-match fallback when nothing to display", async () => {
    mockFetch.mockResolvedValueOnce({ events: [makeEvent("pre")] } as any);

    render(<PastLeagueGames />);

    await waitFor(() =>
      expect(screen.getByText(/No finished matches for this date/i)).toBeInTheDocument()
    );
    expect(matchCardSpy).not.toHaveBeenCalled();
  });

  test("fetches new data when navigating to the next day", async () => {
    const futureEvent = makeEvent("pre");

    mockFetch
      .mockResolvedValueOnce({ events: [] } as any)
      .mockResolvedValueOnce({ events: [futureEvent] } as any);

    const user = userEvent.setup();

    render(<PastLeagueGames />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByText(/No finished matches for this date/i)).toBeInTheDocument()
    );

    await user.click(screen.getByRole("button", { name: /next day/i }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(matchCardSpy).toHaveBeenCalled());

    const props = matchCardSpy.mock.calls[0]?.[0];
    expect(props.state).toBe("pre");
    expect(props.statusText).toMatch(/\d{1,2}:\d{2}/);
  });

  test("surfaces errors from the scoreboard fetch", async () => {
    mockFetch.mockRejectedValueOnce(new Error("scoreboard unavailable"));

    render(<PastLeagueGames />);

    await waitFor(() =>
      expect(screen.getByText(/scoreboard unavailable/i)).toBeInTheDocument()
    );
  });
});
