import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Papa from "papaparse";
import CreateMatch from "../CreateMatch";
import { MemoryRouter } from "react-router-dom";
import { useUser } from "../../../Users/UserContext";

// Mock react-router-dom navigation and params
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

// Mock UserContext
jest.mock("../../../Users/UserContext", () => ({
  useUser: jest.fn(),
}));

// Mock PapaParse
jest.mock("papaparse", () => ({
  parse: jest.fn(),
}));

const mockMatchForm = jest.fn();
jest.mock("../../../components/MatchPageComp/MatchForm", () => ({
  __esModule: true,
  default: (props: any) => {
    mockMatchForm(props);
    return (
      <div data-testid="match-form">
        <button type="button" onClick={props.onCancel}>
          Cancel
        </button>
        <span data-testid="csv-data">
          {JSON.stringify(props.csvData ?? null)}
        </span>
      </div>
    );
  },
}));

describe("CreateMatch", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    (useUser as jest.Mock).mockReturnValue({
      user: { id: "1", username: "testuser" },
    });
    mockUseParams.mockReturnValue({});
    jest.clearAllMocks();
    global.fetch = jest.fn() as any;
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

  test("fetchMatch loads existing match data and maps it to CSV form", async () => {
    mockUseParams.mockReturnValue({ id: "42" });
    const mockResponse = {
      match: {
        utc_kickoff: "2024-06-15T18:45:00Z",
        home_team: { name: "Kaizer Chiefs" },
        away_team: { name: "Orlando Pirates" },
        notes_json: {
          duration: 120,
          lineupTeam1: ["Player A", "Player B"],
          lineupTeam2: ["Player C"],
        },
      },
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <MemoryRouter>
        <CreateMatch />
      </MemoryRouter>
    );

    await waitFor(() => {
      const calls = mockMatchForm.mock.calls;
      const latest = calls[calls.length - 1]?.[0];
      expect(latest?.csvData).toEqual({
        team1: "Kaizer Chiefs",
        team2: "Orlando Pirates",
        date: "2024-06-15",
        time: "18:45",
        duration: "120",
        lineupTeam1: "Player A;Player B",
        lineupTeam2: "Player C",
      });
    });

    const invokedUrl = new URL((global.fetch as jest.Mock).mock.calls[0][0]);
    expect(invokedUrl.searchParams.get("user_id")).toBe("1");
    expect(invokedUrl.searchParams.get("username")).toBe("testuser");
  });

  test("logs when fetchMatch receives non-ok response", async () => {
    mockUseParams.mockReturnValue({ id: "7" });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(
      <MemoryRouter>
        <CreateMatch />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith("Failed to fetch match");
    });

    const latestCall =
      mockMatchForm.mock.calls[mockMatchForm.mock.calls.length - 1];
    const latest = latestCall?.[0];
    expect(latest?.csvData).toBeNull();

    errorSpy.mockRestore();
  });

  test("logs when match data is missing utc_kickoff", async () => {
    mockUseParams.mockReturnValue({ id: "15" });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ match: {} }),
    });

    render(
      <MemoryRouter>
        <CreateMatch />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith("Match data missing utc_kickoff");
    });

    errorSpy.mockRestore();
  });

  test("logs when kickoff date is invalid", async () => {
    mockUseParams.mockReturnValue({ id: "16" });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        match: {
          utc_kickoff: "not-a-date",
        },
      }),
    });

    render(
      <MemoryRouter>
        <CreateMatch />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "Invalid kickoff date:",
        "not-a-date"
      );
    });

    errorSpy.mockRestore();
  });

  test("logs when fetchMatch throws an exception", async () => {
    mockUseParams.mockReturnValue({ id: "99" });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    (global.fetch as jest.Mock).mockRejectedValue(new Error("network down"));

    render(
      <MemoryRouter>
        <CreateMatch />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "Error fetching match:",
        expect.any(Error)
      );
    });

    errorSpy.mockRestore();
  });

  test("clicking upload button triggers hidden file input", () => {
    render(
      <MemoryRouter>
        <CreateMatch />
      </MemoryRouter>
    );

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(input).toBeTruthy();

    const clickSpy = jest.spyOn(input, "click");
    fireEvent.click(screen.getByRole("button", { name: /upload as a csv/i }));
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  test("download template builds CSV blob and link", () => {
    render(
      <MemoryRouter>
        <CreateMatch />
      </MemoryRouter>
    );

    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const createObjectURLSpy = jest.fn(() => "blob://template");
    const revokeSpy = jest.fn();
    (URL as any).createObjectURL = createObjectURLSpy;
    (URL as any).revokeObjectURL = revokeSpy;

    const anchorClickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function () {
        // no-op
      });

    fireEvent.click(
      screen.getByRole("button", { name: /download csv template/i })
    );

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);

    const anchorInstance = anchorClickSpy.mock.instances[0];
    expect(anchorInstance?.download).toBe("match_template.csv");
    expect(anchorInstance?.href).toBe("blob://template");

    expect(revokeSpy).toHaveBeenCalledWith("blob://template");

    if (originalCreate) {
      (URL as any).createObjectURL = originalCreate;
    } else {
      delete (URL as any).createObjectURL;
    }
    if (originalRevoke) {
      (URL as any).revokeObjectURL = originalRevoke;
    } else {
      delete (URL as any).revokeObjectURL;
    }
    anchorClickSpy.mockRestore();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });
});
