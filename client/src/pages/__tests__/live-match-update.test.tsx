import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

jest.mock("../../config", () => ({ baseURL: "http://api.local" }));

import LiveMatchUpdate from "../MatchPages/LiveMatchUpdate";
import { baseURL } from "../../config";

jest.mock("../../Users/UserContext", () => ({
  useUser: () => ({ user: { id: "1", username: "manager" } }),
}));

jest.mock("axios");

const axios = require("axios");

describe("LiveMatchUpdate page", () => {
  const matchPayload = {
    match: {
      id: 7,
      home_team: { id: 10, name: "Home United" },
      away_team: { id: 11, name: "Away City" },
      home_score: 2,
      away_score: 1,
      status: "in_progress",
      minute: 56,
      events: [],
      home_possession: 55,
      notes_json: {
        lineupTeam1: ["Player One", "Player Two"],
        lineupTeam2: ["Player Three"],
      },
    },
  };

  beforeEach(() => {
    axios.get = jest.fn((url: string) => {
      if (url.endsWith("/reports")) {
        return Promise.resolve({ data: { reports: [] } });
      }
      return Promise.resolve({ data: matchPayload });
    });
    axios.post = jest.fn().mockResolvedValue({});
    axios.patch = jest.fn().mockResolvedValue({});
    axios.delete = jest.fn().mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders match data and saves possession", async () => {
    render(
      <MemoryRouter initialEntries={["/live/7"]}>
        <Routes>
          <Route path="/live/:id" element={<LiveMatchUpdate />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading match/)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("Home United vs Away City")).toBeInTheDocument()
    );

    const selects = screen.getAllByRole("combobox");
    const teamSelect = selects[1];
    fireEvent.change(teamSelect, { target: { value: "10" } });

    const saveButton = screen.getByRole("button", { name: /save/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() =>
      expect(axios.patch).toHaveBeenCalledWith(
        `${baseURL}/matches/7/possession`,
        { home_possession: 55, away_possession: 45 }
      )
    );
  });
});
