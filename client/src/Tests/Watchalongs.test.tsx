import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import Watchalongs from "../pages/Watchalongs";

const mockFetchScoreboard = jest.fn();
const mockFetchWatchalongContent = jest.fn();

jest.mock("../api/espn", () => ({
  fetchScoreboard: (...args: unknown[]) => mockFetchScoreboard(...args),
}));

jest.mock("../api/watchalongs", () => ({
  fetchWatchalongContent: (...args: unknown[]) =>
    mockFetchWatchalongContent(...args),
}));

jest.mock("lucide-react", () => ({
  PlayCircle: (props: any) => <svg data-testid="play-icon" {...props} />,
}));

jest.mock("../components/LandingPageComp/WatchalongHub.module.css", () =>
  new Proxy(
    {},
    {
      get: (_target, key) => String(key),
    }
  )
);

describe("Watchalongs page", () => {
  const liveEvent = {
    id: "match-live",
    date: new Date("2025-01-01T18:00:00Z").toISOString(),
    status: { type: { state: "in", detail: "Second half" } },
    competitions: [
      {
        competitors: [
          {
            homeAway: "home",
            team: { shortDisplayName: "Arsenal", abbreviation: "ARS" },
          },
          {
            homeAway: "away",
            team: { shortDisplayName: "Chelsea", abbreviation: "CHE" },
          },
        ],
      },
    ],
  };

  const finalEvent = {
    id: "match-final",
    date: new Date("2024-12-31T18:00:00Z").toISOString(),
    status: { type: { state: "post", detail: "FT" } },
    competitions: [
      {
        competitors: [
          {
            homeAway: "home",
            team: { shortDisplayName: "Liverpool", abbreviation: "LIV" },
          },
          {
            homeAway: "away",
            team: { shortDisplayName: "Spurs", abbreviation: "TOT" },
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01T12:00:00Z"));
    mockFetchScoreboard.mockReset();
    mockFetchWatchalongContent.mockReset();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test("loads matches and surfaces watchalong & reaction content", async () => {
    mockFetchScoreboard.mockResolvedValue({ events: [liveEvent, finalEvent] });
    mockFetchWatchalongContent.mockImplementation(
      (_query: string, options: { mode: string }) =>
        Promise.resolve({
          items: [
            {
              id: `${options.mode}-1`,
              title: options.mode === "watchalong" ? "Watchalong Stream" : "Reaction Clip",
              channelTitle: "Creator",
              url: "https://example.com",
            },
          ],
          isFallback: options.mode === "watchalong",
        })
    );

    render(<Watchalongs />);

    await waitFor(() =>
      expect(
        screen.queryByText(/Fetching today\'s fixtures/i)
      ).not.toBeInTheDocument()
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Arsenal vs Chelsea/i })).toBeInTheDocument()
    );

    await waitFor(() =>
      expect(screen.getAllByText(/Watchalong Stream/i)[0]).toBeInTheDocument()
    );
    expect(screen.getAllByText(/Reaction Clip/i)[0]).toBeInTheDocument();
    expect(mockFetchWatchalongContent).toHaveBeenCalledTimes(2);

    // Switch to the completed match and ensure selection updates
    fireEvent.click(
      screen.getByRole("button", { name: /Liverpool vs Spurs/i })
    );

    await waitFor(() =>
      expect(mockFetchWatchalongContent).toHaveBeenCalledTimes(4)
    );
  });

  test("renders empty state when no fixtures are returned", async () => {
    mockFetchScoreboard.mockResolvedValue({ events: [] });
    mockFetchWatchalongContent.mockResolvedValue({ items: [], isFallback: false });

    render(<Watchalongs />);

    await waitFor(() =>
      expect(
        screen.getByText(/No fixtures found for this window/i)
      ).toBeInTheDocument()
    );
  });
});
