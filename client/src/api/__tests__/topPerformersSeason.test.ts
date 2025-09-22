const fetchScoreboardMock = jest.fn();

jest.mock("../espn", () => {
  const actual = jest.requireActual("../espn");
  return {
    ...actual,
    fetchScoreboard: (...args: unknown[]) => fetchScoreboardMock(...args),
  };
});

import { buildTopPerformersSeason, type TopPerformersSeason } from "../topPerformersSeason";

describe("buildTopPerformersSeason", () => {
  beforeEach(() => {
    fetchScoreboardMock.mockReset();
    localStorage.clear();
    jest.useFakeTimers().setSystemTime(new Date("2024-09-01T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("aggregates goals, cards, and clean sheets across calendar dates", async () => {
    const calendar = ["2024-08-20T00:00Z", "2024-08-27T00:00Z"];

    const calendarBoard = {
      leagues: [{ calendar }],
      events: [],
    };

    const matchDayBoard = {
      events: [
        {
          competitions: [
            {
              competitors: [
                {
                  homeAway: "home",
                  score: "2",
                  team: {
                    id: "100",
                    displayName: "Home FC",
                    logos: [{ href: "home.png" }],
                  },
                },
                {
                  homeAway: "away",
                  score: "0",
                  team: {
                    id: "200",
                    displayName: "Away FC",
                    logo: "away.png",
                  },
                },
              ],
              details: [
                {
                  scoringPlay: true,
                  athletesInvolved: [
                    {
                      id: "p1",
                      displayName: "Hero",
                      team: { id: "100" },
                    },
                  ],
                },
                {
                  yellowCard: true,
                  athletesInvolved: [
                    {
                      id: "p2",
                      displayName: "Villain",
                      team: { id: "200" },
                    },
                  ],
                },
                {
                  redCard: true,
                  athletesInvolved: [
                    {
                      id: "p3",
                      displayName: "Enforcer",
                      team: { id: "200" },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    fetchScoreboardMock
      .mockResolvedValueOnce(calendarBoard)
      .mockResolvedValueOnce(matchDayBoard)
      .mockResolvedValueOnce(matchDayBoard);

    const result = (await buildTopPerformersSeason(2024)) as TopPerformersSeason;

    expect(fetchScoreboardMock).toHaveBeenCalledTimes(3);
    expect(result.goals[0]).toMatchObject({ name: "Hero", value: 2 });
    expect(result.yellows[0]).toMatchObject({ name: "Villain", value: 2 });
    expect(result.reds[0]).toMatchObject({ name: "Enforcer", value: 2 });
    expect(result.cleanSheetsTeam[0]).toMatchObject({ teamId: "100", value: 2 });

    const cached = JSON.parse(
      localStorage.getItem("top-performers-season:eng1:2024") || "{}"
    );
    expect(cached.goals?.[0]?.name).toBe("Hero");
  });

  test("returns cached result when stored value is fresh", async () => {
    const cached: TopPerformersSeason = {
      seasonYear: 2024,
      fetchedAt: Date.now(),
      goals: [{ id: "p", name: "Cached", value: 99 }],
      yellows: [],
      reds: [],
      cleanSheetsTeam: [],
    };
    localStorage.setItem(
      "top-performers-season:eng1:2024",
      JSON.stringify(cached)
    );

    const result = await buildTopPerformersSeason(2024);
    expect(result.goals[0].value).toBe(99);
    expect(fetchScoreboardMock).not.toHaveBeenCalled();
  });
});
