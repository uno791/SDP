import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";

import LiveMatchTimeline from "../LiveMatchTimeline";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("LiveMatchTimeline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders fetched events once loaded", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        match: {
          id: 1,
          home_team: { id: 10, name: "Arsenal" },
          away_team: { id: 20, name: "Chelsea" },
          events: [
            {
              id: 11,
              minute: 55,
              event_type: "goal",
              team_id: 10,
              player_name: "Saka",
              detail: "Right foot",
            },
          ],
        },
      },
    });

    render(<LiveMatchTimeline matchId={1} />);

    expect(screen.getByText(/Loading timeline/i)).toBeInTheDocument();

    expect(
      await screen.findByRole("heading", { name: /arsenal vs chelsea/i })
    ).toBeInTheDocument();

    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("/matches/1")
    ));

    expect(screen.getByText(/55'/i)).toBeInTheDocument();
    expect(screen.getByText(/goal/i)).toBeInTheDocument();
    expect(screen.getByText(/Saka/i)).toBeInTheDocument();
    expect(screen.getByText(/Right foot/i)).toBeInTheDocument();
  });

  test("shows empty state when match is missing", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { match: null } });

    render(<LiveMatchTimeline matchId={42} />);

    expect(
      await screen.findByText(/no match found\./i)
    ).toBeInTheDocument();
  });

  test("shows empty events state", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        match: {
          id: 5,
          home_team: { id: 1, name: "Arsenal" },
          away_team: { id: 2, name: "Spurs" },
          events: [],
        },
      },
    });

    render(<LiveMatchTimeline matchId={5} />);

    expect(await screen.findByText(/no events yet/i)).toBeInTheDocument();
  });
});
