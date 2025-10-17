import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PastMatchCard from "../PastMatchCard";
import type { ScoreboardResponse } from "../../../api/espn";
import {
  fetchScoreboard as fetchScoreboardOriginal,
  extractStatsFromScoreboardEvent as extractStatsOriginal,
} from "../../../api/espn";

jest.mock("../../../api/espn", () => {
  const actual = jest.requireActual("../../../api/espn");
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

const fixedNow = new Date("2024-04-20T12:00:00Z");

describe("PastMatchCard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);
    fetchScoreboard.mockReset();
    extractStatsFromScoreboardEvent.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderComponent = (props?: Partial<React.ComponentProps<typeof PastMatchCard>>) =>
    render(
      <MemoryRouter>
        <PastMatchCard {...props} />
      </MemoryRouter>
    );

  test("shows empty message when no matches are found", async () => {
    fetchScoreboard.mockResolvedValue({ events: [] } as ScoreboardResponse);

    renderComponent({ emptyMessage: "Nothing scheduled" });

    await waitFor(() =>
      expect(fetchScoreboard).toHaveBeenCalled()
    );

    expect(
      await screen.findByText("Nothing scheduled")
    ).toBeInTheDocument();
  });

  test("renders completed match details and toggles card", async () => {
    const matchEvent: ScoreboardResponse["events"][number] = {
      id: "match-1",
      date: "2024-04-19T18:30:00Z",
      shortName: "Chiefs vs Pirates",
      status: {
        type: { state: "post", detail: "FT", completed: true },
      },
      competitions: [
        {
          competitors: [
            {
              homeAway: "home",
              score: "2",
              team: {
                shortDisplayName: "Chiefs",
                displayName: "Kaizer Chiefs",
                name: "Kaizer Chiefs",
                logo: "chiefs.png",
              },
              statistics: [],
            },
            {
              homeAway: "away",
              score: "1",
              team: {
                shortDisplayName: "Pirates",
                displayName: "Orlando Pirates",
                name: "Orlando Pirates",
                logo: "pirates.png",
              },
              statistics: [],
            },
          ],
        },
      ],
    };

    fetchScoreboard.mockResolvedValue({ events: [matchEvent] } as ScoreboardResponse);
    extractStatsFromScoreboardEvent.mockReturnValue({
      metrics: [
        { key: "poss", label: "Possession (%)", homeVal: 60, awayVal: 40, homePct: 60 },
        { key: "shotsontarget", label: "Shots on Target", homeVal: 5, awayVal: 2 },
      ],
      saves: undefined,
      scorers: [{ player: "Player X", minute: "30", teamAbbr: "KC" }],
    });

    renderComponent({ title: "Recent Matches" });

    await screen.findByText("Chiefs");

    expect(screen.getByText("Recent Matches")).toBeInTheDocument();
    expect(screen.getByText("Chiefs")).toBeInTheDocument();
    expect(screen.getByText("Pirates")).toBeInTheDocument();
    expect(screen.getByText("FT")).toBeInTheDocument();

    const card = screen.getByText("Chiefs").closest("[role='button']");
    expect(card).toBeTruthy();

    fireEvent.click(card!);

    expect(
      await screen.findByText("Open Match Viewer")
    ).toBeInTheDocument();
    expect(screen.getByText("Possession (%)")).toBeInTheDocument();
    expect(screen.getByText("Shots on Target")).toBeInTheDocument();
    expect(screen.getByText(/Player X/)).toBeInTheDocument();

    const leagues = fetchScoreboard.mock.calls.map(([, league]) => league);
    expect(leagues.every((value) => value === "eng1")).toBe(true);
  });
});
