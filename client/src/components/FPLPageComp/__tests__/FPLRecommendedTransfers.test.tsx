import { render, screen, waitFor } from "@testing-library/react";
import FPLRecommendedTransfers from "../FPLDashboard/FPLRecommendedTransfers";

jest.mock("../../../api/fpl", () => ({
  getBootstrap: jest.fn(),
  getUserPicks: jest.fn(),
  getFixtures: jest.fn(),
}));

const { getBootstrap, getUserPicks, getFixtures } =
  jest.requireMock("../../../api/fpl");

const mockPlayers = [
  {
    id: 1,
    web_name: "Haaland",
    team: 10,
    element_type: 4,
    total_points: 250,
    form: "8.0",
    value_form: "30.0",
    now_cost: 70, // cheaper so he qualifies
    points_per_game: "8.0",
    minutes: 2000,
    selected_by_percent: "85",
    status: "a",
  },
  {
    id: 2,
    web_name: "Watkins",
    team: 11,
    element_type: 4,
    total_points: 160,
    form: "5.0",
    value_form: "16.0",
    now_cost: 80,
    points_per_game: "5.2",
    minutes: 1900,
    selected_by_percent: "25",
    status: "a",
  },
  {
    id: 3,
    web_name: "Darwin",
    team: 12,
    element_type: 4,
    total_points: 100,
    form: "3.0",
    value_form: "9.0",
    now_cost: 75,
    points_per_game: "3.5",
    minutes: 1200,
    selected_by_percent: "15",
    status: "a",
  },
  {
    id: 4,
    web_name: "Ferguson",
    team: 13,
    element_type: 4,
    total_points: 40,
    form: "1.0",
    value_form: "3.0",
    now_cost: 60,
    points_per_game: "2.0",
    minutes: 800,
    selected_by_percent: "5",
    status: "a",
  },
];

const mockFixtures = [
  {
    team_h: 10,
    team_a: 20,
    event: 1,
    team_h_difficulty: 2,
    team_a_difficulty: 4,
  },
  {
    team_h: 11,
    team_a: 30,
    event: 1,
    team_h_difficulty: 3,
    team_a_difficulty: 4,
  },
  {
    team_h: 12,
    team_a: 40,
    event: 1,
    team_h_difficulty: 3,
    team_a_difficulty: 4,
  },
  {
    team_h: 13,
    team_a: 50,
    event: 1,
    team_h_difficulty: 4,
    team_a_difficulty: 5,
  },
];

const mockUserPicks = {
  picks: [
    { element: 4, is_captain: false }, // Ferguson
    { element: 3, is_captain: false },
    { element: 2, is_captain: false },
  ],
};

const mockApi = () => {
  (getBootstrap as jest.Mock).mockResolvedValue({ elements: mockPlayers });
  (getFixtures as jest.Mock).mockResolvedValue(mockFixtures);
  (getUserPicks as jest.Mock).mockResolvedValue(mockUserPicks);
};

// silence expected console.error noise during API-fail test
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

describe("FPLRecommendedTransfers Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders and shows recommended transfers", async () => {
    mockApi();

    render(<FPLRecommendedTransfers teamId={123} currentGW={38} />);

    await waitFor(() =>
      expect(screen.getByText(/recommended transfers/i)).toBeInTheDocument()
    );

    // Ferguson (weak link) should appear
    expect(screen.getByText(/ferguson/i)).toBeInTheDocument();

    // Haaland (upgrade) should appear — multiple matches expected
    const haalandElements = await screen.findAllByText(/haaland/i);
    expect(haalandElements.length).toBeGreaterThan(0);

    // "Consider selling" appears multiple times — validate at least one
    const sellLabels = screen.getAllByText(/consider selling/i);
    expect(sellLabels.length).toBeGreaterThan(0);
  });

  test("renders 'No recommendations available yet' when no data", async () => {
    (getBootstrap as jest.Mock).mockResolvedValue({ elements: [] });
    (getFixtures as jest.Mock).mockResolvedValue([]);
    (getUserPicks as jest.Mock).mockResolvedValue({ picks: [] });

    render(<FPLRecommendedTransfers teamId={1} currentGW={1} />);

    await waitFor(() =>
      expect(
        screen.getByText(/no recommendations available yet/i)
      ).toBeInTheDocument()
    );
  });

  test("handles API failure gracefully", async () => {
    (getBootstrap as jest.Mock).mockRejectedValue(new Error("fail"));
    (getFixtures as jest.Mock).mockRejectedValue(new Error("fail"));
    (getUserPicks as jest.Mock).mockRejectedValue(new Error("fail"));

    render(<FPLRecommendedTransfers teamId={5} currentGW={10} />);

    await waitFor(() =>
      expect(
        screen.getByText(/no recommendations available yet/i)
      ).toBeInTheDocument()
    );
  });

  test("shows 'No clear upgrade available' when no better players found", async () => {
    const weakPlayers = mockPlayers.map((p) => ({
      ...p,
      total_points: 5,
      form: "1.0",
      points_per_game: "1.0",
    }));

    (getBootstrap as jest.Mock).mockResolvedValue({ elements: weakPlayers });
    (getFixtures as jest.Mock).mockResolvedValue(mockFixtures);
    (getUserPicks as jest.Mock).mockResolvedValue(mockUserPicks);

    render(<FPLRecommendedTransfers teamId={99} currentGW={20} />);

    await waitFor(() =>
      expect(screen.getByText(/recommended transfers/i)).toBeInTheDocument()
    );

    const noUpgradeMessages = screen.getAllByText(
      /no clear upgrade available/i
    );
    expect(noUpgradeMessages.length).toBeGreaterThan(0);
  });
});
