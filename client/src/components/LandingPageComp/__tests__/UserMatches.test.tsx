import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import { act } from "react";

import UserMatches from "../UserMatches";

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

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("UserMatches", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  test("fetches matches for the selected day and expands cards", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          matches: [
            {
              id: 3,
              home_team: { id: 1, name: "Arsenal" },
              away_team: { id: 2, name: "Chelsea" },
              home_score: 0,
              away_score: 0,
              status: "scheduled",
              utc_kickoff: "2024-01-15T14:00:00Z",
              notes_json: { duration: 90 },
            },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { matches: [] } });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<UserMatches />);

    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));
    expect(
      mockedAxios.get.mock.calls[0][0]
    ).toContain("from=2024-01-15T00:00:00");

    const homeTeam = await screen.findAllByText(/Arsenal/i);
    expect(homeTeam.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/0 - 0/)[0]).toBeInTheDocument();

    const headerButton = screen.getAllByRole("button")[0];
    await user.click(headerButton);
    expect(screen.getByTestId("timeline-3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Open Match Viewer/i }));
    expect(matchViewerMock).toHaveBeenCalledWith(
      expect.objectContaining({ matchId: 3 })
    );

    const datePicker = screen.getByDisplayValue("2024-01-15");
    await user.clear(datePicker);
    await user.type(datePicker, "2024-01-16");

    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(2));
    expect(mockedAxios.get.mock.calls[1][0]).toContain(
      "from=2024-01-16T00:00:00"
    );
  });
});
