import {
  extractScorersFromScoreboardEvent,
  extractStatsFromScoreboardEvent,
  formatEspnDate,
} from "../espn";

describe("espn helpers", () => {
  test("formatEspnDate outputs YYYYMMDD", () => {
    const d = new Date("2024-09-15T12:34:56Z");
    expect(formatEspnDate(d)).toBe("20240915");
  });

  test("extractScorersFromScoreboardEvent handles array and scoringPlays payloads", () => {
    const event: any = {
      competitions: [
        {
          competitors: [
            {
              homeAway: "home",
              team: { id: "1", abbreviation: "HOM" },
            },
            {
              homeAway: "away",
              team: { id: "2", abbreviation: "AWY" },
            },
          ],
          details: [
            {
              scoringPlay: true,
              clock: { displayValue: "45+2" },
              team: { id: "1" },
              athletesInvolved: [
                { athlete: { displayName: "Hero" } },
              ],
              text: "Hero converts from the spot",
            },
          ],
        },
      ],
    };

    const withScoringPlays = {
      ...event,
      competitions: [
        {
          ...event.competitions[0],
          details: {
            scoringPlays: [
              {
                clock: { displayValue: "12" },
                team: { abbreviation: "AWY", id: "2" },
                text: "Own goal by defender",
              },
            ],
          },
        },
      ],
    };

    const arrScorers = extractScorersFromScoreboardEvent(event);
    expect(arrScorers[0]).toMatchObject({
      minute: "45+2'",
      player: expect.stringContaining("Hero"),
      teamAbbr: "HOM",
    });

    const scoringPlayScorers = extractScorersFromScoreboardEvent(withScoringPlays as any);
    expect(scoringPlayScorers[0]?.player).toContain("(OG)");
    expect(scoringPlayScorers[0]?.teamAbbr).toBe("AWY");
  });

  test("extractStatsFromScoreboardEvent derives possession and secondary metrics", () => {
    const event: any = {
      competitions: [
        {
          competitors: [
            {
              homeAway: "home",
              statistics: [
                { name: "possessionPct", value: 58 },
                { name: "shotsOnTarget", value: 6 },
                { name: "saves", value: 3 },
              ],
            },
            {
              homeAway: "away",
              statistics: [
                { name: "possessionPct", value: 42 },
                { name: "shotsOnTarget", value: 4 },
                { name: "saves", value: 1 },
              ],
            },
          ],
        },
      ],
    };

    const metrics = extractStatsFromScoreboardEvent(event as any);
    expect(metrics.metrics[0]).toMatchObject({
      key: "poss",
      homeVal: 58,
      awayVal: 42,
    });
    expect(metrics.metrics[1]).toMatchObject({
      label: "Shots on Target",
      homeVal: 6,
      awayVal: 4,
    });
    expect(metrics.saves).toEqual({ home: 3, away: 1 });
  });
});
