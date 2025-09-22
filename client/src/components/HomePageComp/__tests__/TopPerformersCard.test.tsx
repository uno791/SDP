import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import TopPerformersCard from "../TopPerformersCard/TopPerformersCard";
import { buildTopPerformersSeason } from "../../../api/topPerformersSeason";

jest.mock("../../../api/topPerformersSeason", () => ({
  buildTopPerformersSeason: jest.fn(),
}));

const mockBuild = buildTopPerformersSeason as jest.MockedFunction<
  typeof buildTopPerformersSeason
>;

const sampleSeason = {
  seasonYear: 2024,
  fetchedAt: Date.now(),
  goals: [
    {
      id: "101",
      name: "Erling Haaland",
      teamName: "Man City",
      teamLogo: "https://logo",
      value: 27,
    },
  ],
  yellows: [
    {
      id: "202",
      name: "Bruno Fernandes",
      teamName: "Man United",
      teamLogo: "https://logo2",
      value: 10,
    },
  ],
  reds: [
    {
      id: "303",
      name: "Diego Costa",
      teamName: "Wolves",
      teamLogo: "https://logo3",
      value: 2,
    },
  ],
  cleanSheetsTeam: [],
};

describe("TopPerformersCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuild.mockResolvedValue(sampleSeason as any);
  });

  test("shows season leaders once loaded", async () => {
    render(<TopPerformersCard />);

    await waitFor(() =>
      expect(screen.getByText(/Erling Haaland/)).toBeInTheDocument()
    );

    expect(screen.getByText(/Golden Boot/i)).toBeInTheDocument();
    expect(screen.getByText(/Man City/)).toBeInTheDocument();
    expect(screen.getByText("27")).toBeInTheDocument();
  });

  test("renders empty state when no winners", async () => {
    mockBuild.mockResolvedValueOnce({
      ...sampleSeason,
      goals: [],
      yellows: [],
      reds: [],
    } as any);

    render(<TopPerformersCard />);

    await waitFor(() =>
      expect(screen.getByText(/No season data/i)).toBeInTheDocument()
    );
  });

  test("displays error message on failure", async () => {
    mockBuild.mockRejectedValueOnce(new Error("leaders offline"));

    render(<TopPerformersCard />);

    await waitFor(() =>
      expect(screen.getByText(/Could not load season leaders/i)).toBeInTheDocument()
    );
  });
});
