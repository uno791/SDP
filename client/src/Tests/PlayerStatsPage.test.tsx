import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import PlayerStats from "../pages/PlayerStats";

const mockFetchSummaryNormalized = jest.fn();

jest.mock("../api/espn", () => ({
  fetchSummaryNormalized: (...args: unknown[]) =>
    mockFetchSummaryNormalized(...args),
}));

const teamSectionMock = jest.fn(
  ({ teamName, starters, subs }: any) => (
    <div data-testid={`team-${teamName}`}>
      {teamName} starters: {starters.length}, subs: {subs.length}
    </div>
  )
);

jest.mock("../components/PlayerStatsComp/TeamSection", () =>
  (props: any) => teamSectionMock(props)
);

jest.mock("../components/PlayerStatsComp/StatKey", () => () => (
  <div data-testid="stat-key">StatKey</div>
));

jest.mock("../components/PlayerStatsComp/MatchNavBar", () => () => (
  <nav data-testid="match-nav">MatchNavBar</nav>
));

jest.mock("../components/PlayerStatsComp/PlayerStats.module.css", () =>
  new Proxy(
    {},
    {
      get: (_target, key) => String(key),
    }
  )
);

describe("PlayerStats page", () => {
  beforeEach(() => {
    mockFetchSummaryNormalized.mockReset();
    teamSectionMock.mockClear();
    // @ts-ignore
  });

  test("shows helper message when id is missing", () => {
    render(
      <MemoryRouter initialEntries={["/playerstats"]}>
        <Routes>
          <Route path="/playerstats" element={<PlayerStats />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByText((content: string) =>
        content.startsWith("Missing event id")
      )
    ).toBeInTheDocument();
    expect(mockFetchSummaryNormalized).not.toHaveBeenCalled();
  });

  test("loads summary data and passes players to TeamSection", async () => {
    mockFetchSummaryNormalized.mockResolvedValueOnce({
      home: { teamId: "1", teamName: "Home FC", logo: "home.png" },
      away: { teamId: "2", teamName: "Away FC", logo: "away.png" },
      players: [
        {
          athleteId: "h1",
          athleteName: "Home Hero",
          teamId: "1",
          positionAbbr: "FW",
          jersey: "9",
        },
        {
          athleteId: "a1",
          athleteName: "Away Ace",
          teamId: "2",
          positionAbbr: "CB",
          jersey: "4",
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/playerstats?id=123"]}>
        <Routes>
          <Route path="/playerstats" element={<PlayerStats />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Loading player stats…/i)
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.queryByText(/Loading player stats/i)).not.toBeInTheDocument()
    );

    expect(teamSectionMock).toHaveBeenCalledTimes(2);
    const [homeCall, awayCall] = teamSectionMock.mock.calls;
    expect(homeCall[0].teamName).toBe("Home FC");
    expect(homeCall[0].starters).toHaveLength(1);
    expect(awayCall[0].teamName).toBe("Away FC");
    expect(awayCall[0].starters).toHaveLength(1);
    expect(screen.getByTestId("match-nav")).toBeInTheDocument();
  });

  test("renders error when summary request fails", async () => {
    mockFetchSummaryNormalized.mockRejectedValueOnce(new Error("network down"));

    render(
      <MemoryRouter initialEntries={["/playerstats?id=999"]}>
        <Routes>
          <Route path="/playerstats" element={<PlayerStats />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Failed to load: network down/i)).toBeInTheDocument()
    );
  });

  test("falls back to fetching summary players when primary payload is empty", async () => {
    mockFetchSummaryNormalized.mockResolvedValueOnce({
      home: { teamId: "10", teamName: "Home FC" },
      away: { teamId: "20", teamName: "Away FC" },
      players: [],
    });

    const fallbackPlayers = {
      players: [
        {
          athleteId: "h1",
          athleteName: "Starter One",
          teamId: "10",
          jersey: "1",
          positionAbbr: "GK",
          subInMinute: "70+2",
        },
        {
          athleteId: "a1",
          athleteName: "Starter Two",
          teamId: "20",
          jersey: "9",
          positionAbbr: "FW",
          subOutMinute: "65",
        },
      ],
    };

    const fetchSpy = jest
      .spyOn(globalThis as any, "fetch")
      .mockResolvedValue({
        ok: true,
        json: async () => fallbackPlayers,
      } as Response);

    render(
      <MemoryRouter initialEntries={["/playerstats?id=abc"]}>
        <Routes>
          <Route path="/playerstats" element={<PlayerStats />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(teamSectionMock).toHaveBeenCalledTimes(2));
    const [homeCall, awayCall] = teamSectionMock.mock.calls;
    const homeSubs = homeCall[0].subs;
    expect(homeSubs[0]?.subInMinute).toBe(72);
    const awayStarters = awayCall[0].starters;
    expect(awayStarters[0]?.subOutMinute).toBe(65);
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  test("shows no-stats message when both teams lack detailed data", async () => {
    mockFetchSummaryNormalized.mockResolvedValueOnce({
      home: { teamId: "10", teamName: "Home" },
      away: { teamId: "20", teamName: "Away" },
      players: [],
    });

    const fetchSpy = jest
      .spyOn(globalThis as any, "fetch")
      .mockResolvedValue({
        ok: true,
        json: async () => ({ players: [] }),
      } as Response);

    render(
      <MemoryRouter initialEntries={["/playerstats?id=nostats"]}>
        <Routes>
          <Route path="/playerstats" element={<PlayerStats />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(
        screen.getByText(/Detailed player-level stats were not provided/i)
      ).toBeInTheDocument()
    );
    expect(teamSectionMock).toHaveBeenCalledTimes(2);
    fetchSpy.mockRestore();
  });
});
