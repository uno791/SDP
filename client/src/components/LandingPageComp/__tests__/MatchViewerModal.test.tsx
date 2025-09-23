import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";

import MatchViewerModal from "../MatchViewerModal";

jest.mock("axios");
jest.mock("../LiveMatchTimeline", () => ({
  __esModule: true,
  default: ({ matchId }: { matchId: number }) => (
    <div data-testid={`timeline-${matchId}`}>Timeline {matchId}</div>
  ),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("MatchViewerModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders match details and switches tabs", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        match: {
          id: 9,
          status: "in_progress",
          minute: 75,
          home_team: { id: 1, name: "Arsenal" },
          away_team: { id: 2, name: "Chelsea" },
          home_score: 2,
          away_score: 1,
        },
        events: [
          { id: 1, minute: 10, event_type: "goal", team_id: 1 },
          { id: 2, minute: 55, event_type: "yellow_card", team_id: 2 },
          { id: 3, minute: 60, event_type: "shot_off_target", team_id: 1 },
        ],
        lineupTeam1: ["Player A", "Player B"],
        lineupTeam2: ["Player C"],
      },
    });

    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<MatchViewerModal matchId={9} onClose={onClose} />);

    expect(screen.getByText(/Loading/)).toBeInTheDocument();

    expect(await screen.findByText(/Arsenal/i)).toBeInTheDocument();
    expect(screen.getByText(/2 - 1/)).toBeInTheDocument();
    expect(screen.getByText(/75' LIVE/)).toBeInTheDocument();
    expect(screen.getByTestId("timeline-9")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Stats/i }));
    const shotsOnBlock = screen.getByText(/Shots on Target/i)
      .parentElement as HTMLElement;
    expect(shotsOnBlock).toHaveTextContent("1");
    expect(shotsOnBlock).toHaveTextContent("0");

    const shotsOffBlock = screen.getByText(/Shots off Target/i)
      .parentElement as HTMLElement;
    expect(shotsOffBlock).toHaveTextContent("1");
    expect(shotsOffBlock).toHaveTextContent("0");

    await user.click(screen.getByRole("button", { name: /Squad/i }));
    expect(screen.getByText(/Player A/i)).toBeInTheDocument();
    expect(screen.getByText(/Player C/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /✕/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("surfaces missing match state", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { match: null } });

    render(<MatchViewerModal matchId={101} onClose={jest.fn()} />);

    expect(await screen.findByText(/Match not found/i)).toBeInTheDocument();
  });
});
