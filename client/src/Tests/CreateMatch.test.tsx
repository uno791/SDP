import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";

import CreateMatch from "../pages/MatchPages/CreateMatch";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const original = jest.requireActual("react-router-dom");
  return {
    ...original,
    useNavigate: () => mockNavigate,
  };
});

jest.mock("../Users/UserContext", () => ({
  useUser: () => ({
    user: { id: 99, username: "tester" },
  }),
}));

function renderCreateMatch() {
  return render(
    <MemoryRouter initialEntries={["/create-match"]}>
      <Routes>
        <Route path="/create-match" element={<CreateMatch />} />
        <Route path="/my-matches" element={<div>Mock My Matches Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("CreateMatch Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders header and upload CSV button", () => {
    renderCreateMatch();
    expect(
      screen.getByRole("heading", { name: /build your fixture/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /upload as a csv/i })
    ).toBeInTheDocument();
  });

  test("renders MatchForm with team input fields", () => {
    renderCreateMatch();
    expect(screen.getByText(/fill in team/i)).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(/team names/i).length).toBe(2);
    expect(
      screen.getByRole("button", { name: /create match/i })
    ).toBeInTheDocument();
  });

  test("cancel button triggers navigation to My Matches", () => {
    renderCreateMatch();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/my-matches");
  });

  test("user can type team names and submit", () => {
    renderCreateMatch();

    const [team1Input, team2Input] = screen.getAllByPlaceholderText(/team names/i);

    fireEvent.change(team1Input, { target: { value: "Barcelona" } });
    fireEvent.change(team2Input, { target: { value: "Real Madrid" } });

    fireEvent.click(screen.getByRole("button", { name: /create match/i }));

    expect(team1Input).toHaveValue("Barcelona");
    expect(team2Input).toHaveValue("Real Madrid");
  });
});

