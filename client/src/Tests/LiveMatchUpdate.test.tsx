import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";

// SUT
import LiveMatchUpdate from "../pages/MatchPages/LiveMatchUpdate";

// ✅ mock react-router-dom useParams
jest.mock("react-router-dom", () => {
  const original = jest.requireActual("react-router-dom");
  return {
    ...original,
    useParams: () => ({ id: "1" }),
  };
});

// ✅ mock UserContext
jest.mock("../Users/UserContext", () => ({
  useUser: () => ({
    user: { id: 123, username: "testuser" },
  }),
}));

function renderLiveMatchUpdate() {
  return render(
    <MemoryRouter initialEntries={["/live/1"]}>
      <Routes>
        <Route path="/live/:id" element={<LiveMatchUpdate />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("LiveMatchUpdate Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders match title, username and score", () => {
    renderLiveMatchUpdate();

    expect(
      screen.getByRole("heading", { name: /liverpool vs man united/i })
    ).toBeInTheDocument();
    expect(screen.getByText("testuser")).toBeInTheDocument();
    expect(screen.getByText(/0 - 1/)).toBeInTheDocument();
    expect(screen.getByText(/67'/)).toBeInTheDocument();
  });

  test("renders existing timeline event", () => {
    renderLiveMatchUpdate();

    expect(
      screen.getByText("55' Goal – Cunha (Man United)")
    ).toBeInTheDocument();
  });

  test("can add a new event", () => {
    renderLiveMatchUpdate();

    // select event type
    fireEvent.change(screen.getByDisplayValue("Event Type"), {
      target: { value: "Yellow Card" },
    });
    // select team
    fireEvent.change(screen.getByDisplayValue("Team"), {
      target: { value: "Liverpool" },
    });
    // select player
    fireEvent.change(screen.getByDisplayValue("Player"), {
      target: { value: "Salah" },
    });

    fireEvent.click(screen.getByText("ADD EVENT"));

    expect(
      screen.getByText("67' Yellow Card – Salah (Liverpool)")
    ).toBeInTheDocument();
  });

  test("does not add event if form is incomplete", () => {
    renderLiveMatchUpdate();

    fireEvent.click(screen.getByText("ADD EVENT"));

    // still only initial event present
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(1);
  });
});
