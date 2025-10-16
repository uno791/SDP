import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import PlayerStats from "../../pages/PlayerStats";

jest.mock("../../api/espn", () => ({
  fetchSummaryNormalized: jest.fn().mockResolvedValue({}),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useSearchParams: () => [new URLSearchParams("id=test")],
}));

describe("PlayerStats page", () => {
  const mockSummary = {
    home: { teamId: "1", teamName: "Home Club", logo: "home.png" },
    away: { teamId: "2", teamName: "Away Club", logo: "away.png" },
    players: [
      {
        athleteId: "101",
        athleteName: "Player One",
        teamId: "1",
        teamName: "Home Club",
        positionAbbr: "FW",
        jersey: "9",
        goals: 1,
      },
      {
        athleteId: "202",
        athleteName: "Player Two",
        teamId: "2",
        teamName: "Away Club",
        positionAbbr: "GK",
        jersey: "1",
        saves: 3,
      },
    ],
  };

  it("renders loading state then content", async () => {
    const originalFetch = global.fetch;
    if (!originalFetch) {
      (global as any).fetch = jest.fn();
    }
    const fetchSpy = jest.spyOn(global, "fetch");

    const espn = require("../../api/espn");
    const fetchSummaryNormalized = espn.fetchSummaryNormalized as jest.Mock;
    fetchSummaryNormalized.mockResolvedValueOnce(mockSummary);

    render(
      <MemoryRouter initialEntries={["/playerstats?id=test"]}>
        <PlayerStats />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading/)).toBeInTheDocument();

    await waitFor(() => expect(fetchSummaryNormalized).toHaveBeenCalled());
    await screen.findByText("Player Statistics");

    const homeLabels = await screen.findAllByText("Home Club");
    expect(homeLabels.length).toBeGreaterThan(0);
    const awayLabels = await screen.findAllByText("Away Club");
    expect(awayLabels.length).toBeGreaterThan(0);
    expect(await screen.findByText("Player One")).toBeInTheDocument();

    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    if (!originalFetch) {
      delete (global as any).fetch;
    }
  });
});
