import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import { act } from "react";

import LiveUserMatches from "../LiveUserMatches";

jest.mock("axios");
jest.mock("../LiveMatchTimeline", () => ({
  __esModule: true,
  default: ({ matchId }: { matchId: number }) => (
    <div data-testid={`timeline-${matchId}`}>Timeline {matchId}</div>
  ),
}));

const matchViewerMock = jest.fn();
jest.mock("../MatchViewerModal", () => ({
  __esModule: true,
  default: (props: any) => {
    matchViewerMock(props);
    return <div data-testid="match-viewer-modal" />;
  },
}));

const reportModalMock = jest.fn();
jest.mock("../ReportModal", () => ({
  __esModule: true,
  default: (props: any) => {
    reportModalMock(props);
    return <div data-testid="report-modal" />;
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("LiveUserMatches", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-03-10T15:30:00Z"));
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  test("shows empty state when no matches are live", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { matches: [] } });

    render(<LiveUserMatches />);

    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());
    expect(
      screen.getByText(/No user matches are live right now/i)
    ).toBeInTheDocument();
  });

  test("renders live match cards, allows expanding and opens modals", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        matches: [
          {
            id: 5,
            home_team: { id: 1, name: "Arsenal" },
            away_team: { id: 2, name: "Chelsea" },
            home_score: 1,
            away_score: 1,
            status: "in_progress",
            utc_kickoff: "2024-03-10T15:00:00Z",
            notes_json: { duration: 90 },
            home_possession: 58,
            away_possession: 42,
          },
        ],
      },
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<LiveUserMatches />);

    const homeTeamLabels = await screen.findAllByText(/Arsenal/i);
    expect(homeTeamLabels.length).toBeGreaterThan(0);
    expect(screen.getByText(/1 - 1/)).toBeInTheDocument();
    expect(screen.getByText(/30'/)).toBeInTheDocument();

    const headerButton = screen.getAllByRole("button")[0];
    await user.click(headerButton);

    expect(await screen.findByTestId("timeline-5")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Open Match Viewer/i }));
    expect(matchViewerMock).toHaveBeenCalledWith(
      expect.objectContaining({ matchId: 5 })
    );
    expect(screen.getByTestId("match-viewer-modal")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Report/i }));
    expect(reportModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ matchId: 5 })
    );
    expect(screen.getByTestId("report-modal")).toBeInTheDocument();
  });
});
