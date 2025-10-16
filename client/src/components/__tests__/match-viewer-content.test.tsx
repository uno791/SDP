import { render, screen } from "@testing-library/react";

import MatchViewerContent from "../MatchViewerComp/MatchViewerContent";

describe("MatchViewerContent", () => {
  const baseProps = {
    title: "Test Fixture",
    homeName: "Home FC",
    awayName: "Away FC",
    homeScore: 1,
    awayScore: 2,
    statusText: "FT",
    homeLogoUrl: "home.png",
    awayLogoUrl: "away.png",
    homeScorers: ["Player 1 10'"],
    awayScorers: ["Player 2 70'"],
    sections: [
      {
        title: "Possession",
        rows: [{ label: "Possession", left: "55%", right: "45%" }],
      },
      {
        title: "Timeline",
        content: <p data-testid="timeline">Timeline body</p>,
      },
    ],
  };

  it("renders sections and passes highlight classes", () => {
    render(
      <MatchViewerContent
        {...baseProps}
        goalHighlight
        summaryHighlightClassName="animate-winner"
        winnerSide="away"
        overlay={<div data-testid="overlay" />}
      />
    );

    expect(screen.getByRole("heading", { name: "Test Fixture" })).toBeInTheDocument();
    expect(screen.getByTestId("overlay")).toBeInTheDocument();
    expect(screen.getByText("Timeline body")).toBeInTheDocument();

    const awayLabel = screen.getByText("Away FC");
    expect(awayLabel).toHaveStyle(
      { textShadow: "0 0 12px rgba(251, 191, 36, 0.75)" }
    );
  });
});
