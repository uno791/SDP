import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";

// SUT
import MyMatches from "../pages/MatchPages/MyMatches";

// ✅ mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const original = jest.requireActual("react-router-dom");
  return {
    ...original,
    useNavigate: () => mockNavigate,
  };
});

function renderMyMatches(initialRoute = "/") {
  return render(
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
  });

  test("renders the create button", () => {
    renderMyMatches();
    expect(screen.getByText("CREATE NEW MATCH")).toBeInTheDocument();
  });

  test("navigates to create match when button clicked", () => {
    renderMyMatches();
    fireEvent.click(screen.getByText("CREATE NEW MATCH"));
    expect(mockNavigate).toHaveBeenCalledWith("/create-match");
  });

  test("renders all three sections", () => {
    renderMyMatches();
    expect(screen.getByText("CURRENT GAMES")).toBeInTheDocument();
    expect(screen.getByText("UPCOMING GAMES")).toBeInTheDocument();
    expect(screen.getByText("PAST GAMES")).toBeInTheDocument();
  });

  test("navigates to live match page when onSeeMore triggered", () => {
    renderMyMatches();

    // one of the live matches will have a "See more" button (from MatchCard)
    const seeMoreButtons = screen.getAllByRole("button", { name: /see more/i });
    fireEvent.click(seeMoreButtons[0]);

    // should navigate with the correct id
    expect(mockNavigate).toHaveBeenCalledWith("/live/1");
  });
});
