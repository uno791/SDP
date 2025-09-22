import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import PlayerTable, { type PlayerRow } from "../PlayerStatsComp/PlayerTable";
import TeamSection from "../PlayerStatsComp/TeamSection";
import StatKey from "../PlayerStatsComp/StatKey";
import MatchNavBar from "../PlayerStatsComp/MatchNavBar";

describe("PlayerStats components", () => {
  const sampleRow: PlayerRow = {
    id: "1",
    name: "Alex Midfielder",
    side: "home",
    starter: true,
    position: "CM",
    teamLogoUrl: "logo.png",
    shirt: 10,
    G: 1,
    A: 2,
    SH: 3,
    ST: 1,
    FC: 0,
    YC: 1,
    RC: 0,
    SV: 0,
    subIn: true,
    subOut: true,
    subInMinute: 60,
    subOutMinute: 85,
  };

  test("PlayerTable renders rows and substitution badges", () => {
    render(<PlayerTable rows={[sampleRow]} title="Starting XI" />);

    expect(screen.getByText("Starting XI")).toBeInTheDocument();
    const playerCell = screen.getByText("Alex Midfielder").closest("td");
    expect(playerCell).toBeTruthy();
    const badges = within(playerCell!).getAllByText(/60’|85’/);
    expect(badges).toHaveLength(2);
  });

  test("PlayerTable gracefully handles missing players", () => {
    render(<PlayerTable rows={[]} title="Substitutes" />);
    expect(screen.getByText("No players.")).toBeInTheDocument();
  });

  test("PlayerTable hides broken logos", () => {
    render(<PlayerTable rows={[{ ...sampleRow, teamLogoUrl: "bad.png" }]} />);
    const img = screen.getByAltText("home team logo") as HTMLImageElement;
    fireEvent.error(img);
    expect(img.style.visibility).toBe("hidden");
  });

  test("TeamSection renders two tables", () => {
    render(
      <TeamSection
        teamName="Foot FC"
        starters={[sampleRow]}
        subs={[{ ...sampleRow, id: "2", name: "Sub Player", starter: false }]}
      />
    );

    expect(screen.getByRole("heading", { name: "Foot FC" })).toBeInTheDocument();
    const tables = screen.getAllByRole("table");
    expect(tables).toHaveLength(2);
  });

  test("StatKey lists explanatory items", () => {
    render(<StatKey />);
    expect(screen.getByText("Stat Key")).toBeInTheDocument();
    expect(screen.getByText(/Appearances/)).toBeInTheDocument();
    expect(screen.getByText(/Goals scored/)).toBeInTheDocument();
  });

  test("MatchNavBar renders links when id present", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/playerstats?id=match-1"]}>
        <MatchNavBar />
      </MemoryRouter>
    );

    const overviewLink = screen.getByRole("link", { name: "Match Overview" });
    expect(overviewLink).toHaveAttribute("href", "/matchviewer?id=match-1");

    const burgerButton = screen.getByRole("button", { name: /open menu/i });
    await user.click(burgerButton);

    // After clicking, the menu should show navigation links from the burger menu
    expect(screen.getByRole("link", { name: "Favourite Teams" })).toBeInTheDocument();
  });

  test("MatchNavBar returns null without id", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/playerstats"]}>
        <MatchNavBar />
      </MemoryRouter>
    );

    expect(container).toBeEmptyDOMElement();
  });
});
