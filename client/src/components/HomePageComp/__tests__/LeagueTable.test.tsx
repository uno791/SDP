import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import LeagueTable from "../LeagueTable/LeagueTable";
import { fetchEplStandings } from "../../../api/espn";

jest.mock("../../../api/espn", () => ({
  fetchEplStandings: jest.fn(),
}));

const mockFetch = fetchEplStandings as jest.MockedFunction<typeof fetchEplStandings>;

const rows = [
  { pos: 1, team: "Arsenal", p: 30, w: 20, d: 5, l: 5, gd: 30, pts: 65 },
  { pos: 2, team: "Liverpool", p: 30, w: 18, d: 8, l: 4, gd: 25, pts: 62 },
];

describe("LeagueTable", () => {
  const currentYear = new Date().getFullYear();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue(rows);
  });

  test("renders standings data once loaded", async () => {
    render(<LeagueTable />);

    await waitFor(() =>
      expect(screen.getByText(/Arsenal/)).toBeInTheDocument()
    );

    expect(mockFetch).toHaveBeenCalledWith({ season: currentYear, level: 3 });
    expect(screen.getByText(/Liverpool/)).toBeInTheDocument();
    expect(screen.getAllByText("Pts").length).toBeGreaterThan(0);
  });

  test("navigates to previous season", async () => {
    render(<LeagueTable />);
    const user = userEvent.setup();

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    const prev = screen.getByRole("button", { name: /previous season/i });
    expect(prev).not.toBeDisabled();

    await user.click(prev);

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith({ season: currentYear - 1, level: 3 })
    );
  });

  test("displays error state", async () => {
    mockFetch.mockRejectedValueOnce(new Error("standings down"));

    render(<LeagueTable />);

    await waitFor(() =>
      expect(screen.getByText(/standings down/i)).toBeInTheDocument()
    );
  });

  test("shows empty message when no rows", async () => {
    mockFetch.mockResolvedValueOnce([]);

    render(<LeagueTable />);

    await waitFor(() =>
      expect(screen.getByText(/Standings not available/i)).toBeInTheDocument()
    );
  });
});
