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

  test("normalizes fallback competitor stats into table rows", async () => {
    mockFetchSummaryNormalized.mockResolvedValueOnce({
      home: { teamId: "10", teamName: "Home FC" },
      away: { teamId: "20", teamName: "Away FC" },
      players: [],
    });

    const fallbackPayload = {
      boxscore: {
        players: [
          {
            team: { id: "10", displayName: "Home FC" },
            athletes: [
              {
                athlete: {
                  id: "h1",
                  displayName: "Home Hero",
                  position: { abbreviation: "fw" },
                  headshot: { href: "hero.png" },
                },
                stats: [
                  { name: "TotalGoals", value: "2" },
                  { name: "ShotsOnTarget", displayValue: "3" },
                  { name: "TotalShots", value: "8" },
                  { name: "FoulsCommitted", stat: "5" },
                  { name: "YellowCards", value: "$1" },
                  { name: "RedCards", value: "0" },
                  { name: "GoalsConceded", value: "1" },
                  { name: "ShotsFaced", value: 4 },
                  { name: "FoulsSuffered", value: "abc" },
                  { name: "", value: "7" },
                ],
                jersey: "9",
                sub_in_minute: "60+2",
                subMinuteOut: 88,
              },
            ],
          },
          {
            team: { id: "20", displayName: "Away FC" },
            athletes: [
              {
                athlete: {
                  id: "a1",
                  displayName: "Away Ace",
                  position: { abbreviation: "cb" },
                },
                stats: [
                  { name: "GoalAssists", value: "1" },
                  { name: "Shots", value: "10" },
                  { name: "ShotsOnTarget", value: "4" },
                  { name: "Offsides", value: "2" },
                  { name: "SavesMade", value: "3" },
                  { name: "TotalShots", displayValue: "10" },
                  { name: "TotalGoals", value: "0" },
                ],
                jersey: "4",
              },
            ],
          },
        ],
      },
    };

    const fetchSpy = jest
      .spyOn(globalThis as any, "fetch")
      .mockResolvedValue({
        ok: true,
        json: async () => fallbackPayload,
      } as Response);

    render(
      <MemoryRouter initialEntries={["/playerstats?id=comp"]}>
        <Routes>
          <Route path="/playerstats" element={<PlayerStats />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(teamSectionMock).toHaveBeenCalledTimes(2));

    const homeCall = teamSectionMock.mock.calls.find(
      ([props]) => props.teamName === "Home FC"
    );
    const awayCall = teamSectionMock.mock.calls.find(
      ([props]) => props.teamName === "Away FC"
    );

    expect(homeCall).toBeDefined();
    expect(awayCall).toBeDefined();

    const homeSubs = homeCall?.[0].subs ?? [];
    expect(homeSubs).toHaveLength(1);
    expect(homeSubs[0]).toMatchObject({
      name: "Home Hero",
      position: "FW",
      subIn: true,
      subOut: true,
      G: 2,
      ST: 3,
      SH: 8,
      FC: 5,
      YC: 1,
      RC: 0,
      GA: 1,
      SHF: 4,
    });
    expect(homeSubs[0].FA).toBe(0);

    const awayStarters = awayCall?.[0].starters ?? [];
    expect(awayStarters).toHaveLength(1);
    expect(awayStarters[0]).toMatchObject({
      name: "Away Ace",
      position: "CB",
      G: 0,
      A: 1,
      SH: 10,
      ST: 4,
      OF: 2,
      SV: 3,
    });

    fetchSpy.mockRestore();
  });

  test("normalizes fallback roster payloads when boxscore athletes missing", async () => {
    mockFetchSummaryNormalized.mockResolvedValueOnce({
      home: { teamId: "10", teamName: "Home FC" },
      away: { teamId: "20", teamName: "Away FC" },
      players: [],
    });

    const fallbackPayload = {
      rosters: [
        {
          team: { id: "10", displayName: "Home FC" },
          roster: [
            {
              player: {
                id: "h99",
                shortName: "Keeper",
                position: { abbreviation: "gk" },
              },
              statistics: [
                { name: "SavesMade", value: "6" },
                { name: "ShotsFaced", value: "9" },
                { name: "GoalsConceded", value: "2" },
                { name: "YellowCards", displayValue: "0" },
              ],
              shirt: "1",
              imageUrl: "keeper.png",
              subMinuteOut: "90+1",
            },
          ],
        },
        {
          team: { id: "20", displayName: "Away FC" },
          roster: [
            {
              player: {
                id: "a77",
                displayName: "Playmaker",
                position: { abbreviation: "mf" },
              },
              statistics: [
                { name: "GoalAssists", value: "2" },
                { name: "TotalGoals", value: "1" },
                { name: "TotalShots", value: "5" },
                { name: "ShotsOnTarget", displayValue: "75%" },
              ],
              jersey: "10",
              subbedIn: false,
            },
          ],
        },
      ],
    };

    const fetchSpy = jest
      .spyOn(globalThis as any, "fetch")
      .mockResolvedValue({
        ok: true,
        json: async () => fallbackPayload,
      } as Response);

    render(
      <MemoryRouter initialEntries={["/playerstats?id=roster"]}>
        <Routes>
          <Route path="/playerstats" element={<PlayerStats />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(teamSectionMock).toHaveBeenCalledTimes(2));

    const homeCall = teamSectionMock.mock.calls.find(
      ([props]) => props.teamName === "Home FC"
    );
    const awayCall = teamSectionMock.mock.calls.find(
      ([props]) => props.teamName === "Away FC"
    );

    expect(homeCall).toBeDefined();
    expect(awayCall).toBeDefined();

    const homeStarters = homeCall?.[0].starters ?? [];
    expect(homeStarters).toHaveLength(1);
    expect(homeStarters[0]).toMatchObject({
      name: "Keeper",
      position: "GK",
      shirt: "1",
      subOut: true,
      SV: 6,
      SHF: 9,
      GA: 2,
    });

    const awayStarters = awayCall?.[0].starters ?? [];
    expect(awayStarters).toHaveLength(1);
    expect(awayStarters[0]).toMatchObject({
      name: "Playmaker",
      position: "MF",
      shirt: "10",
      G: 1,
      A: 2,
      SH: 5,
    });
    expect(awayStarters[0].ST).toBe(75);

    fetchSpy.mockRestore();
  });
});
