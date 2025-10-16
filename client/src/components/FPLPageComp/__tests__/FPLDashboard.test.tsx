import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import FPLDashboard from "../FPLDashboard/FPLDashboard";

// ---- mock dependencies ----
jest.mock("../../../api/fpl", () => ({
  getBootstrap: jest.fn(),
  getEntryHistory: jest.fn(),
  getUserPicks: jest.fn(),
}));

jest.mock("../FPLDashboard/FPLSummaryCard", () => () => (
  <div data-testid="summary-card">SummaryCard</div>
));
jest.mock("../FPLDashboard/FPLTeamLineup", () => () => (
  <div data-testid="team-lineup">TeamLineup</div>
));
jest.mock("../FPLDashboard/FPLTransferAnalysis", () => () => (
  <div data-testid="transfer-analysis">TransferAnalysis</div>
));
jest.mock("../FPLDashboard/FPLLeagueInsights", () => () => (
  <div data-testid="league-insights">LeagueInsights</div>
));
jest.mock("../FPLDashboard/FPLBestPlayers", () => () => (
  <div data-testid="best-players">BestPlayers</div>
));
jest.mock("../FPLDashboard/FPLRecommendedTransfers", () => () => (
  <div data-testid="recommended-transfers">RecommendedTransfers</div>
));

const { getBootstrap, getEntryHistory, getUserPicks } =
  jest.requireMock("../../../api/fpl");

// ---- sample mock data ----
const mockBootstrap = {
  elements: [
    { id: 1, web_name: "Player A", photo: "a.jpg", element_type: 1 },
    { id: 2, web_name: "Player B", photo: "b.jpg", element_type: 2 },
  ],
};

const mockHistory = {
  current: [
    {
      event: 37,
      points: 45,
      overall_rank: 1000,
      event_transfers: 1,
      event_transfers_cost: 4,
    },
  ],
};

const mockPicks = {
  picks: [
    { element: 1, position: 1, is_captain: true, is_vice_captain: false },
    { element: 2, position: 2, is_captain: false, is_vice_captain: true },
  ],
};

// ---- tests ----
describe("FPLDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders loading message initially", async () => {
    (getBootstrap as jest.Mock).mockResolvedValue(mockBootstrap);
    (getEntryHistory as jest.Mock).mockResolvedValue(mockHistory);
    (getUserPicks as jest.Mock).mockResolvedValue(mockPicks);

    render(<FPLDashboard teamId={123} onBack={jest.fn()} />);
    expect(screen.getByText(/loading your fpl data/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.queryByText(/loading your fpl data/i)
      ).not.toBeInTheDocument()
    );
  });

  test("renders all key subcomponents after loading", async () => {
    (getBootstrap as jest.Mock).mockResolvedValue(mockBootstrap);
    (getEntryHistory as jest.Mock).mockResolvedValue(mockHistory);
    (getUserPicks as jest.Mock).mockResolvedValue(mockPicks);

    render(<FPLDashboard teamId={999} onBack={jest.fn()} />);

    // wait until loading finishes
    await waitFor(() => {
      expect(screen.getByTestId("summary-card")).toBeInTheDocument();
    });

    // check that every subcomponent is present
    expect(screen.getByTestId("summary-card")).toBeInTheDocument();
    expect(screen.getByTestId("team-lineup")).toBeInTheDocument();
    expect(screen.getByTestId("transfer-analysis")).toBeInTheDocument();
    expect(screen.getByTestId("recommended-transfers")).toBeInTheDocument();
    expect(screen.getByTestId("league-insights")).toBeInTheDocument();
    expect(screen.getByTestId("best-players")).toBeInTheDocument();
  });

  test("calls onBack when Back button is clicked", async () => {
    (getBootstrap as jest.Mock).mockResolvedValue(mockBootstrap);
    (getEntryHistory as jest.Mock).mockResolvedValue(mockHistory);
    (getUserPicks as jest.Mock).mockResolvedValue(mockPicks);

    const handleBack = jest.fn();
    render(<FPLDashboard teamId={77} onBack={handleBack} />);

    await waitFor(() => screen.getByTestId("summary-card"));

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  test("handles missing current gameweek gracefully", async () => {
    (getBootstrap as jest.Mock).mockResolvedValue(mockBootstrap);
    (getEntryHistory as jest.Mock).mockResolvedValue({ current: [] });
    (getUserPicks as jest.Mock).mockResolvedValue(mockPicks);

    render(<FPLDashboard teamId={55} onBack={jest.fn()} />);

    await waitFor(() =>
      expect(screen.getByTestId("transfer-analysis")).toBeInTheDocument()
    );

    // these depend on currentGW, so they should NOT render
    expect(
      screen.queryByTestId("recommended-transfers")
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("league-insights")).not.toBeInTheDocument();
  });
});
