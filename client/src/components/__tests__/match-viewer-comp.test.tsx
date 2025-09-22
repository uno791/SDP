import { render, screen } from "@testing-library/react";
import TriStatRow from "../MatchViewerComp/TriStatRow";
import ComicCard from "../MatchViewerComp/ComicCard";
import PlayerStatsCard from "../MatchViewerComp/PlayerStatsCard";
import PossessionPassingCard from "../MatchViewerComp/PossessionPassingCard";
import SetPiecesSavesCard from "../MatchViewerComp/SetPiecesSavesCard";
import DefensiveActionsCard from "../MatchViewerComp/DefensiveActionsCard";
import DisciplineFoulsCard from "../MatchViewerComp/DisciplineFoulsCard";
import CrossingLongBallsCard from "../MatchViewerComp/CrossingLongBallsCard";
import ShootingCard from "../MatchViewerComp/ShootingCard";
import GameSummaryCard from "../MatchViewerComp/GameSummaryCard";

describe("Match viewer components", () => {
  test("TriStatRow displays default placeholders", () => {
    render(<TriStatRow label="Possession" />);
    expect(screen.getByText("Possession")).toBeInTheDocument();
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  test("ComicCard renders title and children", () => {
    render(
      <ComicCard title="Stats">
        <div>Body</div>
      </ComicCard>
    );

    expect(screen.getByText("Stats")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  test("PlayerStatsCard shows static roster", () => {
    render(<PlayerStatsCard />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Mohamed Salah")).toBeInTheDocument();
  });

  test("Stat cards render without crashing", () => {
    render(
      <>
        <PossessionPassingCard />
        <SetPiecesSavesCard />
        <DefensiveActionsCard />
        <DisciplineFoulsCard />
        <CrossingLongBallsCard />
        <ShootingCard />
      </>
    );

    expect(screen.getAllByRole("heading", { level: 3 }).length).toBeGreaterThan(0);
  });

  test("GameSummaryCard formats scorers and scores", () => {
    render(
      <GameSummaryCard
        homeName="Foot FC"
        awayName="Ball AFC"
        homeScore={2}
        awayScore="1"
        statusText="FT"
        homeLogoUrl="home.png"
        awayLogoUrl="away.png"
        homeScorers={[
          { player: "Hero", minute: "12" },
          { player: "Penalty King", minute: "90+2", isPenalty: true },
        ]}
        awayScorers={["Own Goal 55' (OG)"]}
      />
    );

    expect(screen.getByText("Foot FC")).toBeInTheDocument();
    expect(screen.getByText("2–1")).toBeInTheDocument();
    expect(screen.getByText("Hero 12'")).toBeInTheDocument();
    expect(screen.getByText("Penalty King (p) 90+2'"))
      .toBeInTheDocument();
    expect(screen.getByText(/Own Goal/)).toBeInTheDocument();
  });
});
