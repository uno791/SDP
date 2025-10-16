import { render, screen } from "@testing-library/react";

import GameSummaryCard from "../MatchViewerComp/GameSummaryCard";

describe("GameSummaryCard", () => {
  it("formats scorer details inferred from text and applies tags", () => {
    render(
      <GameSummaryCard
        homeName="Home United"
        awayName="Away City"
        homeScore={2}
        awayScore={1}
        statusText="FT"
        homeScorers={[
          {
            minute: "45+1",
            text: "Goal by Jane Smith converts penalty",
          },
        ]}
        awayScorers={[
          {
            player: "Alex Johnson",
            minute: "55",
            isOG: true,
          },
        ]}
        winnerSide="home"
      />
    );

    const leftScorer = screen.getByText((content) =>
      content.includes("Jane Smith") && content.includes("(p)")
    );
    expect(leftScorer.textContent).toContain("45+1'");

    expect(screen.getByText("Alex Johnson (OG) 55'"))
      .toBeInTheDocument();

    const homeName = screen.getByText("Home United");
    expect(homeName).toHaveStyle(
      { textShadow: "0 0 12px rgba(251, 191, 36, 0.75)" }
    );
  });

  it("falls back to generic Goal label when no details are provided", () => {
    render(
      <GameSummaryCard
        homeName="Home United"
        awayName="Away City"
        homeScore={0}
        awayScore={0}
        statusText="HT"
        homeScorers={[{ minute: "12" }]}
        awayScorers={[]}
      />
    );

    expect(screen.getByText("Goal 12'"))
      .toBeInTheDocument();
  });
});
