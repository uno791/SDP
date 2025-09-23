import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import MatchCard from "../MatchCard/MatchCard";

const baseProps = {
  id: "match-1",
  home: { name: "Arsenal", score: "2", logo: "home.png" },
  away: { name: "Spurs", score: "1", logo: "away.png" },
  statusText: "FT",
  metrics: [
    { key: "poss", label: "Possession (%)", homeVal: 60, awayVal: 40, homePct: 60 },
    { key: "shots", label: "Shots on Target", homeVal: 5, awayVal: 3, homePct: 63 },
  ],
  saves: { home: 4, away: 2 },
  scorers: [
    { minute: "12'", player: "Saka", teamAbbr: "ARS" },
    { minute: "33'", player: "Kane", teamAbbr: "TOT" },
  ],
};

describe("MatchCard", () => {
  test("expands to reveal stats, scorers, and CTA", async () => {
    const user = userEvent.setup();

    render(<MatchCard {...baseProps} state="post" />);

    const toggle = screen.getByRole("button", { name: /arsenal/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Possession (%)")).toBeInTheDocument();
    expect(screen.getByText("Saves")).toBeInTheDocument();
    expect(screen.getByText(/Scorers/i)).toBeInTheDocument();
    expect(screen.getByText("12' – Saka (ARS)")).toBeInTheDocument();

    const cta = screen.getByRole("link", { name: /open match viewer/i });
    expect(cta).toHaveAttribute("href", "/matchviewer?id=match-1");

    await user.click(cta);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  test("does not show expanded content for pre-match state", async () => {
    const user = userEvent.setup();

    render(<MatchCard {...baseProps} state="pre" />);

    const toggle = screen.getByRole("button", { name: /arsenal/i });
    await user.click(toggle);

    expect(screen.queryByText(/Scorers/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /open match viewer/i })).not.toBeInTheDocument();
  });
});
