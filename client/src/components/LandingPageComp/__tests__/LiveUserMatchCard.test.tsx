import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";

import LiveUserMatchCard from "../LiveUserMatchCard";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const baseMatch = {
  id: 77,
  home_team: { id: 1, name: "Arsenal" },
  away_team: { id: 2, name: "Spurs" },
  home_score: 2,
  away_score: 1,
  status: "in_progress",
  minute: 65,
} as const;

describe("LiveUserMatchCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("calculates and displays match stats from fetched events", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        events: [
          {
            id: 1,
            minute: 12,
            event_type: "goal",
            team_id: 1,
            player_name: "Saka",
          },
          {
            id: 2,
            minute: 40,
            event_type: "shot_off_target",
            team_id: 2,
          },
          {
            id: 3,
            minute: 52,
            event_type: "shot_on_target",
            team_id: 1,
          },
        ],
      },
    });

    render(<LiveUserMatchCard match={baseMatch} />);

    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining(`/matches/${baseMatch.id}/events`)
    ));

    expect(
      screen.getByText(/Arsenal/i, { selector: "span" })
    ).toBeInTheDocument();
    expect(screen.getByText(/2 - 1/)).toBeInTheDocument();
    expect(screen.getByText(/65'/)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText(/Shots On/i).parentElement).toHaveTextContent(
        "2 - 0"
      )
    );

    expect(screen.getByText(/Shots Off/i).parentElement).toHaveTextContent(
      "0 - 1"
    );
    expect(screen.getByText(/Accuracy/i).parentElement).toHaveTextContent(
      "100% - 0%"
    );
  });

  test("handles matches without team info gracefully", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { events: [] } });

    render(
      <LiveUserMatchCard
        match={{
          ...baseMatch,
          home_team: null,
          away_team: null,
          home_score: null,
          away_score: null,
        }}
      />
    );

    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());

    expect(screen.getByText(/Team A/i)).toBeInTheDocument();
    expect(screen.getByText(/Team B/i)).toBeInTheDocument();
    expect(screen.getAllByText(/0 - 0/)[0]).toBeInTheDocument();
  });
});
