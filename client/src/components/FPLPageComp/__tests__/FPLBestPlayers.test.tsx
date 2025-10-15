import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import FPLBestPlayers from "../FPLDashboard/FPLBestPlayers";

jest.mock("../../../api/fpl", () => ({
  getBootstrap: jest.fn(),
  getFixtures: jest.fn(),
}));

const { getBootstrap, getFixtures } = jest.requireMock("../../../api/fpl");

// --- mock data ---
const mockPlayers = [
  {
    id: 1,
    web_name: "Haaland",
    team: 10,
    element_type: 4,
    total_points: 210,
    form: "8.5",
    value_form: "2.0",
    now_cost: 125,
    points_per_game: "6.5",
    minutes: 2800,
    selected_by_percent: "75.0",
    status: "a",
  },
  {
    id: 2,
    web_name: "Saka",
    team: 3,
    element_type: 3,
    total_points: 190,
    form: "7.0",
    value_form: "1.8",
    now_cost: 90,
    points_per_game: "5.8",
    minutes: 2600,
    selected_by_percent: "45.0",
    status: "a",
  },
  {
    id: 3,
    web_name: "Unknown Player",
    team: 1,
    element_type: 2,
    total_points: 0,
    form: "0",
    value_form: "0",
    now_cost: 45,
    points_per_game: "0",
    minutes: 120,
    status: "i", // injured → filtered out
  },
];

const mockFixtures = [
  {
    team_h: 10,
    team_a: 3,
    event: 38,
    team_h_difficulty: 2,
    team_a_difficulty: 3,
  },
  {
    team_h: 3,
    team_a: 1,
    event: 39,
    team_h_difficulty: 3,
    team_a_difficulty: 4,
  },
];

// --- helper ---
const mockApi = (players = mockPlayers, fixtures = mockFixtures) => {
  (getBootstrap as jest.Mock).mockResolvedValue({ elements: players });
  (getFixtures as jest.Mock).mockResolvedValue(fixtures);
};

// --- tests ---
describe("FPLBestPlayers Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows loading message initially", async () => {
    mockApi();
    render(<FPLBestPlayers />);

    expect(screen.getByText(/loading best players/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.queryByText(/loading best players/i)
      ).not.toBeInTheDocument()
    );
  });

  test("renders table of top players after loading", async () => {
    mockApi();
    render(<FPLBestPlayers />);

    await waitFor(() => {
      expect(screen.getByText(/best players to have/i)).toBeInTheDocument();
    });

    // should show player names (Haaland & Saka)
    expect(screen.getByText("Haaland")).toBeInTheDocument();
    expect(screen.getByText("Saka")).toBeInTheDocument();

    // should not include filtered out player
    expect(screen.queryByText("Unknown Player")).not.toBeInTheDocument();

    // table headers exist
    expect(screen.getByText("Player")).toBeInTheDocument();
    expect(screen.getByText("Form")).toBeInTheDocument();
  });

  test("renders 'No player data available' when API returns empty", async () => {
    mockApi([], []);
    render(<FPLBestPlayers />);

    await waitFor(() =>
      expect(screen.getByText(/no player data available/i)).toBeInTheDocument()
    );
  });

  test("changes position filter correctly", async () => {
    mockApi();
    render(<FPLBestPlayers />);

    await waitFor(() =>
      expect(screen.getByText("Haaland")).toBeInTheDocument()
    );

    const dropdown = screen.getByRole("combobox");
    fireEvent.change(dropdown, { target: { value: "3" } }); // filter midfielders

    // since Haaland is FWD (4) and Saka is MID (3), only Saka should remain
    await waitFor(() => {
      expect(screen.queryByText("Haaland")).not.toBeInTheDocument();
      expect(screen.getByText("Saka")).toBeInTheDocument();
    });
  });

  test("handles API errors gracefully", async () => {
    (getBootstrap as jest.Mock).mockRejectedValue(new Error("bootstrap fail"));
    (getFixtures as jest.Mock).mockRejectedValue(new Error("fixtures fail"));

    render(<FPLBestPlayers />);
    await waitFor(() =>
      expect(screen.getByText(/no player data available/i)).toBeInTheDocument()
    );
  });
});
