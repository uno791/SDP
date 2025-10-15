import {
  fetchEplNews,
  fetchEplStandings,
  fetchScoreboard,
} from "../espn";

describe("league-aware ESPN endpoints", () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test("fetchScoreboard uses league-specific path and dates parameter", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ events: [] }),
    } as unknown as Response);

    const date = new Date("2025-01-15T00:00:00Z");
    await fetchScoreboard(date, "ucl");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("soccer/uefa.champions/scoreboard")
    );

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("dates=20250115");
  });

  test("fetchEplNews hits the selected league feed", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ header: "", articles: [] }),
    } as unknown as Response);

    await fetchEplNews("fra1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("soccer/fra.1/news")
    );
  });

  test("fetchEplStandings queries the league-specific standings endpoint", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        standings: [
          {
            entries: [
              {
                team: { displayName: "Team A" },
                stats: [
                  { name: "gamesPlayed", value: 1 },
                  { name: "wins", value: 1 },
                  { name: "ties", value: 0 },
                  { name: "losses", value: 0 },
                  { name: "goalDifferential", value: 2 },
                  { name: "points", value: 3 },
                  { name: "rank", value: 1 },
                ],
              },
            ],
          },
        ],
      }),
    } as unknown as Response);

    const rows = await fetchEplStandings({ league: "esp1", level: 3, season: 2024 });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("soccer/esp.1/standings")
    );
    expect(rows).toEqual(
      expect.arrayContaining([expect.objectContaining({ team: "Team A", pos: 1 })])
    );
  });
});
