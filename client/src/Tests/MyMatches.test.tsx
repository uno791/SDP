import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";

// SUT
import MyMatches from "../pages/MatchPages/MyMatches";
import { renderWithUser } from "./test-utils";

// ✅ mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const original = jest.requireActual("react-router-dom");
  return {
    ...original,
    useNavigate: () => mockNavigate,
  };
});

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

function renderMyMatches(initialRoute = "/") {
  return renderWithUser(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={<MyMatches />} />
        <Route
          path="/create-match"
          element={<div>Mock CreateMatch Page</div>}
        />
        <Route path="/live/:id" element={<div>Mock Live Match Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("MyMatches Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: { matches: [] } });
  });

  test("renders the create button", () => {
    renderMyMatches();
    expect(screen.getByText("Create New Match")).toBeInTheDocument();
  });

  test("navigates to create match when button clicked", () => {
    renderMyMatches();
    fireEvent.click(screen.getByText("Create New Match"));
    expect(mockNavigate).toHaveBeenCalledWith("/create-match");
  });

  test("renders all three sections", () => {
    renderMyMatches();
    expect(screen.getByText("Current Games")).toBeInTheDocument();
    expect(screen.getByText("Upcoming Games")).toBeInTheDocument();
    expect(screen.getByText("Past Games")).toBeInTheDocument();
  });

  test("navigates to live match page when onSeeMore triggered", async () => {
    const now = new Date();
    const liveKickoff = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    mockedAxios.get.mockResolvedValue({
      data: {
        matches: [
          {
            id: 1,
            home_team: { id: 10, name: "Liverpool" },
            away_team: { id: 20, name: "Man United" },
            status: "in_progress",
            utc_kickoff: liveKickoff,
            notes_json: { duration: 90 },
          },
        ],
      },
    });

    renderMyMatches();

    // one of the live matches will have a "See more" button (from MatchCard)
    const seeMoreButtons = await screen.findAllByRole("button", {
      name: /see more/i,
    });
    fireEvent.click(seeMoreButtons[0]);

    // should navigate with the correct id
    expect(mockNavigate).toHaveBeenCalledWith("/live/1");
  });
});
