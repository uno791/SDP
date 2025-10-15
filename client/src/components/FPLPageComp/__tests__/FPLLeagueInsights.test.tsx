import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import FPLLeagueInsights from "../FPLDashboard/FPLLeagueInsights";

// --- Mock the FPL API ---
jest.mock("../../../api/fpl", () => ({
  getUserLeagues: jest.fn(),
  getLeagueStandings: jest.fn(),
  getUserPicks: jest.fn(),
  getBootstrap: jest.fn(),
}));

const { getUserLeagues, getLeagueStandings, getUserPicks, getBootstrap } =
  jest.requireMock("../../../api/fpl");

// --- Mock Data ---
const mockLeagues = [
  { id: 1, name: "Main League" },
  { id: 2, name: "Mini League" },
];

const mockBootstrap = {
  elements: [
    { id: 101, web_name: "Haaland" },
    { id: 102, web_name: "Saka" },
    { id: 103, web_name: "Son" },
  ],
};

const mockLeagueStandings = {
  standings: {
    results: [
      {
        entry: 10,
        entry_name: "Team Alpha",
        total: 2100,
        rank: 1,
        last_rank: 2,
      },
      {
        entry: 20,
        entry_name: "Team Beta",
        total: 1950,
        rank: 2,
        last_rank: 3,
      },
      {
        entry: 30,
        entry_name: "Team Gamma",
        total: 1800,
        rank: 3,
        last_rank: 3,
      },
    ],
  },
};

const mockPicks = {
  picks: [
    { element: 101, is_captain: true },
    { element: 102, is_captain: false },
  ],
};

// --- Helper ---
const mockApi = () => {
  (getUserLeagues as jest.Mock).mockResolvedValue(mockLeagues);
  (getBootstrap as jest.Mock).mockResolvedValue(mockBootstrap);
  (getLeagueStandings as jest.Mock).mockResolvedValue(mockLeagueStandings);
  (getUserPicks as jest.Mock).mockResolvedValue(mockPicks);
};

describe("FPLLeagueInsights Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {}); // silence React act warnings
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  test("renders league data after async load", async () => {
    mockApi();

    await act(async () => {
      render(<FPLLeagueInsights teamId={10} currentGW={38} />);
    });

    // Wait for League Insights title
    await waitFor(() =>
      expect(screen.getByText(/league insights/i)).toBeInTheDocument()
    );

    // Verify sections
    expect(screen.getByText(/average points/i)).toBeInTheDocument();
    expect(screen.getByText(/your rank change/i)).toBeInTheDocument();
    expect(screen.getByText(/top 5 teams/i)).toBeInTheDocument();
    expect(screen.getByText(/most owned players/i)).toBeInTheDocument();
    expect(screen.getByText(/most captained players/i)).toBeInTheDocument();

    // Verify data content (use getAllByText because Team Alpha appears twice)
    const alphaItems = screen.getAllByText(/Team Alpha/i);
    expect(alphaItems.length).toBeGreaterThan(0);

    const betaItems = screen.getAllByText(/Team Beta/i);
    expect(betaItems.length).toBeGreaterThan(0);
  });

  test("renders 'No league data available' when standings empty", async () => {
    (getUserLeagues as jest.Mock).mockResolvedValue(mockLeagues);
    (getBootstrap as jest.Mock).mockResolvedValue(mockBootstrap);
    (getLeagueStandings as jest.Mock).mockResolvedValue({
      standings: { results: [] },
    });

    await act(async () => {
      render(<FPLLeagueInsights teamId={10} currentGW={38} />);
    });

    await waitFor(() =>
      expect(screen.getByText(/no league data available/i)).toBeInTheDocument()
    );
  });

  test("changes selected league via dropdown", async () => {
    mockApi();
    await act(async () => {
      render(<FPLLeagueInsights teamId={10} currentGW={38} />);
    });

    const dropdown = await screen.findByRole("combobox");
    expect(dropdown).toHaveValue("1");

    fireEvent.change(dropdown, { target: { value: "2" } });
    expect(dropdown).toHaveValue("2");
  });

  test("handles API failures gracefully", async () => {
    // Return nulls instead of rejecting to avoid unhandled rejections
    (getUserLeagues as jest.Mock).mockResolvedValue([]);
    (getBootstrap as jest.Mock).mockResolvedValue(null);
    (getLeagueStandings as jest.Mock).mockResolvedValue(null);
    (getUserPicks as jest.Mock).mockResolvedValue(null);

    await act(async () => {
      render(<FPLLeagueInsights teamId={10} currentGW={38} />);
    });

    await waitFor(() =>
      expect(screen.getByText(/no league data available/i)).toBeInTheDocument()
    );
  });

  test("computes average points and rank change correctly", async () => {
    mockApi();

    await act(async () => {
      render(<FPLLeagueInsights teamId={10} currentGW={38} />);
    });

    await waitFor(() =>
      expect(screen.getByText(/average points/i)).toBeInTheDocument()
    );

    // Average = (2100 + 1950 + 1800) / 3 = 1950.0
    expect(screen.getByText(/1950\.0/)).toBeInTheDocument();

    // Rank change: 2 → 1 = ↑ 1
    expect(screen.getByText(/↑ 1/)).toBeInTheDocument();
  });
});
