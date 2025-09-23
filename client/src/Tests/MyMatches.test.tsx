import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";

import MyMatches from "../pages/MatchPages/MyMatches";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const original = jest.requireActual("react-router-dom");
  return {
    ...original,
    useNavigate: () => mockNavigate,
  };
});

jest.mock("axios");
jest.mock("../Users/UserContext", () => ({
  useUser: () => ({
    user: { id: 7, username: "tester" },
  }),
}));
jest.mock("../components/LandingPageComp/MatchViewerModal", () => ({
  __esModule: true,
  default: ({ matchId }: { matchId: number }) => (
    <div data-testid={`viewer-${matchId}`}>Viewer {matchId}</div>
  ),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

const buildMatches = () => {
  const now = Date.now();
  const iso = (offsetMinutes: number) =>
    new Date(now + offsetMinutes * 60 * 1000).toISOString();

  return [
    {
      id: 1,
      home_team: { id: 1, name: "Alpha" },
      away_team: { id: 2, name: "Beta" },
      home_score: 2,
      away_score: 1,
      status: "in_progress",
      utc_kickoff: iso(-30),
      minute: 45,
      notes_json: { duration: 90 },
    },
    {
      id: 2,
      home_team: { id: 3, name: "Gamma" },
      away_team: { id: 4, name: "Delta" },
      home_score: null,
      away_score: null,
      status: "scheduled",
      utc_kickoff: iso(120),
      notes_json: { duration: 90 },
    },
    {
      id: 3,
      home_team: { id: 5, name: "Epsilon" },
      away_team: { id: 6, name: "Zeta" },
      home_score: 0,
      away_score: 0,
      status: "final",
      utc_kickoff: iso(-240),
      notes_json: { duration: 90 },
    },
  ];
};

function renderMyMatches(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={<MyMatches />} />
        <Route path="/create-match" element={<div>Mock CreateMatch Page</div>} />
        <Route path="/live/:id" element={<div>Mock Live Match Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("MyMatches Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({
      data: { matches: buildMatches() },
    });
  });

  test("renders the create button", async () => {
    renderMyMatches();
    const createButton = await screen.findByRole("button", { name: /create new match/i });
    expect(createButton).toBeInTheDocument();
  });

  test("navigates to create match when button clicked", async () => {
    renderMyMatches();
    await screen.findByRole("button", { name: /create new match/i });
    fireEvent.click(screen.getByRole("button", { name: /create new match/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/create-match");
  });

  test("renders all three sections", async () => {
    renderMyMatches();
    expect(await screen.findByText(/current games/i)).toBeInTheDocument();
    expect(screen.getByText(/upcoming games/i)).toBeInTheDocument();
    expect(screen.getByText(/past games/i)).toBeInTheDocument();
  });

  test("navigates to live match page when live CTA is clicked", async () => {
    renderMyMatches();
    const liveButton = await screen.findByRole("button", { name: /see more/i });
    fireEvent.click(liveButton);
    expect(mockNavigate).toHaveBeenCalledWith("/live/1");
  });

  test("navigates to edit screen for upcoming matches", async () => {
    renderMyMatches();
    const editButton = await screen.findByRole("button", { name: /edit/i });
    fireEvent.click(editButton);
    expect(mockNavigate).toHaveBeenCalledWith("/create-match?matchId=2");
  });

  test("opens match viewer for past matches", async () => {
    renderMyMatches();
    const viewerButton = await screen.findByRole("button", {
      name: /open match viewer/i,
    });
    fireEvent.click(viewerButton);
    expect(await screen.findByTestId("viewer-3")).toBeInTheDocument();
  });
});

