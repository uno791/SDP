import { render, screen } from "@testing-library/react";
import FPLSummaryCard from "../FPLDashboard/FPLSummaryCard"; // adjust this path if needed

describe("FPLSummaryCard Component", () => {
  const mockData = {
    current: [
      {
        event: 36,
        points: 55,
        overall_rank: 123456,
        event_transfers: 2,
        event_transfers_cost: 4,
      },
      {
        event: 37,
        points: 62,
        overall_rank: 110000,
        event_transfers: 1,
        event_transfers_cost: 0,
      },
      {
        event: 38,
        points: 70,
        overall_rank: 90000,
        event_transfers: 0,
        event_transfers_cost: 0,
      },
    ],
  };

  test("renders latest gameweek number and points", () => {
    render(<FPLSummaryCard data={mockData} />);

    expect(screen.getByText(/gameweek 38/i)).toBeInTheDocument();
    expect(screen.getByText("70")).toBeInTheDocument();
    expect(screen.getByText(/gw points/i)).toBeInTheDocument();
  });

  test("shows total points correctly", () => {
    render(<FPLSummaryCard data={mockData} />);

    const totalPoints = 55 + 62 + 70;
    expect(screen.getByText(totalPoints.toString())).toBeInTheDocument();
    expect(screen.getByText(/total points/i)).toBeInTheDocument();
  });

  test("shows formatted overall rank (handles space or comma)", () => {
    render(<FPLSummaryCard data={mockData} />);

    // toLocaleString() can format differently depending on system locale
    const rankElement = screen.getByText((content) =>
      /90[ ,]?000/.test(content)
    );
    expect(rankElement).toBeInTheDocument();
    expect(screen.getByText(/overall rank/i)).toBeInTheDocument();
  });

  test("renders transfers and hits correctly", () => {
    render(<FPLSummaryCard data={mockData} />);

    expect(screen.getByText(/transfers:/i)).toBeInTheDocument();
    expect(screen.getByText(/hits:/i)).toBeInTheDocument();

    // Two zeros should appear (for transfers and hits)
    const zeroElements = screen.getAllByText("0");
    expect(zeroElements.length).toBeGreaterThanOrEqual(2);
  });

  test("renders safely when current is empty", () => {
    const emptyData = { current: [] };
    render(<FPLSummaryCard data={emptyData} />);

    // Fallback message should appear instead of crashing
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });
});
