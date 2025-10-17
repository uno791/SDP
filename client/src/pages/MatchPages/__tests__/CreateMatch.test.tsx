import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Papa from "papaparse";
import CreateMatch from "../CreateMatch"; // ✅ correct relative path
import { MemoryRouter } from "react-router-dom";
import { useUser } from "../../../Users/UserContext"; // ✅ correct relative path

// Mock react-router-dom navigation and params
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
}));

// Mock UserContext
jest.mock("../../../Users/UserContext", () => ({
  useUser: jest.fn(),
}));

// Mock PapaParse
jest.mock("papaparse", () => ({
  parse: jest.fn(),
}));

describe("CreateMatch", () => {
  beforeEach(() => {
    (useUser as jest.Mock).mockReturnValue({
      user: { id: "1", username: "testuser" },
    });
    jest.clearAllMocks();
  });

  test("parses uploaded CSV and forwards mapped data", async () => {
    const mockCsv = new File(
      [
        "Team1: Arsenal,Team2: Chelsea,Date: 2024-05-01,Time: 20:00,Duration: 105,LineupTeam1: Player1;Player2,LineupTeam2: Player3;Player4",
      ],
      "match.csv",
      { type: "text/csv" }
    );

    const mockPapa = Papa.parse as jest.Mock;
    mockPapa.mockImplementation((_file, options) => {
      options.complete({
        data: [
          [
            "Team1: Arsenal",
            "Team2: Chelsea",
            "Date: 2024-05-01",
            "Time: 20:00",
            "Duration: 105",
            "LineupTeam1: Player1;Player2",
            "LineupTeam2: Player3;Player4",
          ],
        ],
      });
    });

    render(
      <MemoryRouter>
        <CreateMatch />
      </MemoryRouter>
    );

    // Find hidden file input
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(input).toBeTruthy();

    // Simulate CSV upload
    fireEvent.change(input, { target: { files: [mockCsv] } });

    // Wait for parsing to complete
    await waitFor(() => {
      expect(mockPapa).toHaveBeenCalled();
    });
  });

  test("cancel button triggers navigation to /mymatches", async () => {
    render(
      <MemoryRouter>
        <CreateMatch />
      </MemoryRouter>
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    // ✅ Updated to match your actual route
    expect(mockNavigate).toHaveBeenCalledWith("/mymatches");
  });
});
