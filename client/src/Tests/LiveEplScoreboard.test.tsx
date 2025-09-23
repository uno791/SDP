import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import LivePremScoreboard from "../pages/liveeplscoreboard";

describe("LivePremScoreboard", () => {
  const originalFetch = global.fetch;
  let setIntervalSpy: jest.SpyInstance;
  let clearIntervalSpy: jest.SpyInstance;

  beforeEach(() => {
    global.fetch = jest.fn() as any;
    setIntervalSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    clearIntervalSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  test("renders live match cards after successful fetch", async () => {
    const mockData = {
      events: [
        {
          id: "e1",
          name: "Arsenal vs Chelsea",
          shortName: "ARS vs CHE",
          competitions: [
            {
              status: {
                type: { state: "in", detail: "45'", shortDetail: "45'" },
                displayClock: "45:12",
              },
              competitors: [
                {
                  id: "1",
                  homeAway: "home",
                  score: "1",
                  team: {
                    displayName: "Arsenal",
                    shortDisplayName: "ARS",
                    logo: "home.png",
                  },
                  statistics: [
                    { name: "shots", displayValue: "5" },
                    { name: "shotsOnGoal", displayValue: "3" },
                    { name: "cornerKicks", displayValue: "4" },
                    { name: "foulsCommitted", displayValue: "6" },
                    { name: "possession", displayValue: "55" },
                  ],
                },
                {
                  id: "2",
                  homeAway: "away",
                  score: "0",
                  team: {
                    displayName: "Chelsea",
                    shortDisplayName: "CHE",
                    logo: "away.png",
                  },
                  statistics: [
                    { name: "shots", displayValue: "2" },
                    { name: "shotsOnGoal", displayValue: "1" },
                    { name: "cornerKicks", displayValue: "1" },
                    { name: "foulsCommitted", displayValue: "8" },
                    { name: "possession", displayValue: "45" },
                  ],
                },
              ],
              details: [
                {
                  type: { id: "70", text: "Goal" },
                  team: { id: "1" },
                  clock: { displayValue: "12'" },
                  athletesInvolved: [{ id: "p1", displayName: "Bukayo Saka" }],
                },
              ],
              venue: { fullName: "Emirates Stadium" },
              broadcasts: [{ names: ["Sky Sports"] }],
              odds: [
                {
                  provider: { name: "ESPN BET", priority: 1 },
                  moneyline: {
                    home: { current: { odds: "+120" } },
                    away: { current: { odds: "+250" } },
                    draw: { current: { odds: "+200" } },
                  },
                  total: {
                    over: { current: { line: "2.5", odds: "-110" } },
                    under: { current: { line: "2.5", odds: "-105" } },
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    (global.fetch as unknown as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    );

    await act(async () => {
      render(<LivePremScoreboard />);
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.getByText(/Arsenal/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Chelsea/)).toBeInTheDocument();
    expect(screen.queryByText(/No live Premier League matches/i)).not.toBeInTheDocument();
  });

  test("shows an error banner when the fetch fails", async () => {
    (global.fetch as unknown as jest.Mock).mockImplementation(() =>
      Promise.resolve({ ok: false, status: 503 })
    );

    await act(async () => {
      render(<LivePremScoreboard />);
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.getByText(/HTTP 503/i)).toBeInTheDocument()
    );
  });
});
