import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

jest.mock("../../config", () => ({ baseURL: "http://api.local" }));

import MyMatches from "../MatchPages/MyMatches";

jest.mock("../../Users/UserContext", () => ({
  useUser: () => ({ user: { id: "42", username: "host" } }),
}));

jest.mock("axios");

const axios = require("axios");

describe("MyMatches page", () => {
  const now = new Date("2024-05-01T12:00:00Z");
  const matches = [
    {
      id: 1,
      home_team: { id: 1, name: "Live FC" },
      away_team: { id: 2, name: "Visitors" },
      home_score: 1,
      away_score: 0,
      status: "in_progress",
      utc_kickoff: new Date(now.getTime() - 30 * 60000).toISOString(),
      notes_json: { duration: 90 },
    },
    {
      id: 2,
      home_team: { id: 3, name: "Upcoming" },
      away_team: { id: 4, name: "Rivals" },
      status: "scheduled",
      utc_kickoff: new Date(now.getTime() + 60 * 60000).toISOString(),
      notes_json: { duration: 90 },
    },
    {
      id: 3,
      home_team: { id: 5, name: "Finished" },
      away_team: { id: 6, name: "Legends" },
      home_score: 3,
      away_score: 3,
      status: "final",
      utc_kickoff: new Date(now.getTime() - 200 * 60000).toISOString(),
      notes_json: { duration: 90 },
    },
  ];

  let originalFetch: any;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    axios.get = jest.fn().mockResolvedValue({ data: { matches } });
    originalFetch = global.fetch;
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      delete (global as any).fetch;
    }
  });

  it("segments matches and handles delete confirmation", async () => {
    render(
      <MemoryRouter>
        <MyMatches />
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    expect(await screen.findByText(/Live FC/)).toBeInTheDocument();
    const upcomingBadges = await screen.findAllByText(/Upcoming/);
    expect(upcomingBadges.length).toBeGreaterThan(0);
    const finishedBadges = await screen.findAllByText(/Finished/);
    expect(finishedBadges.length).toBeGreaterThan(0);

    const deleteButton = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(deleteButton);

    expect(screen.getByText(/Are you sure/)).toBeInTheDocument();

    const confirm = screen.getAllByRole("button", { name: "Delete" })[1];
    fireEvent.click(confirm);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });
});
