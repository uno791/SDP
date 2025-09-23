import { screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import axios from "axios";

import LiveMatchUpdate from "../pages/MatchPages/LiveMatchUpdate";
import { renderWithUser } from "./test-utils";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const normalizeTimelineText = (value: string) =>
  value
    .replace(/🗑️/g, "")
    .replace(/\s*'\s*/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const timelineMatcher = (expected: string) => {
  const normalizedExpected = normalizeTimelineText(expected);

  return (_content: string, node?: Element | null) => {
    if (!node || node.tagName !== "LI") {
      return false;
    }

    const text = normalizeTimelineText(node.textContent ?? "");
    return text === normalizedExpected;
  };
};

type MatchData = ReturnType<typeof createBaseMatch>;

function createBaseMatch() {
  return {
    id: 1,
    home_team: { id: 10, name: "Liverpool" },
    away_team: { id: 20, name: "Man United" },
    home_score: 0,
    away_score: 1,
    status: "in_progress",
    minute: 67,
    events: [
      {
        id: 1,
        minute: 55,
        event_type: "goal",
        team_id: 20,
        player_name: "Cunha",
      },
    ],
    home_possession: 55,
    away_possession: 45,
  };
}

const mockReportsResponse = { data: { reports: [] } };

function renderLiveMatchUpdate() {
  return renderWithUser(
    <MemoryRouter initialEntries={["/live/1"]}>
      <Routes>
        <Route path="/live/:id" element={<LiveMatchUpdate />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("LiveMatchUpdate Page", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
    mockedAxios.delete.mockReset();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const arrangeHappyPath = (matchOverride?: MatchData) => {
    const matchData = matchOverride ? { ...matchOverride } : createBaseMatch();

    mockedAxios.get.mockImplementation((url: string) => {
      if (url.endsWith("/reports")) {
        return Promise.resolve(mockReportsResponse);
      }
      return Promise.resolve({ data: { match: matchData } });
    });

    mockedAxios.post.mockResolvedValue({ data: {} });
    mockedAxios.delete.mockResolvedValue({ data: {} });

    return matchData;
  };

  test("renders match title, username and score", async () => {
    arrangeHappyPath();
    renderLiveMatchUpdate();

    expect(
      await screen.findByRole("heading", { name: /liverpool vs man united/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText(/0 - 1/)).toBeInTheDocument();
    expect(screen.getByText(/67'/)).toBeInTheDocument();
  });

  test("renders existing timeline event", async () => {
    arrangeHappyPath();
    renderLiveMatchUpdate();

    await screen.findByRole("heading", { name: /liverpool vs man united/i });

    expect(
      screen.getByText(timelineMatcher("55' Goal – Cunha (Man United)"))
    ).toBeInTheDocument();
  });

  test("can add a new event", async () => {
    const matchData = arrangeHappyPath();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    mockedAxios.post.mockImplementation(async () => {
      matchData.events = [
        ...matchData.events,
        {
          id: 2,
          minute: 67,
          event_type: "yellow_card",
          team_id: matchData.home_team.id,
          player_name: "Salah",
        },
      ];
      return { data: {} };
    });

    renderLiveMatchUpdate();
    await screen.findByRole("heading", {
      name: /liverpool vs man united/i,
    });

    await user.selectOptions(screen.getByDisplayValue("Event Type"), [
      "yellow_card",
    ]);
    await user.selectOptions(screen.getByDisplayValue("Team"), [
      String(matchData.home_team.id),
    ]);
    await user.type(screen.getByPlaceholderText("Player name"), "Salah");

    await user.click(screen.getByText("ADD EVENT"));

    await waitFor(() => {
      expect(
        screen.getByText(timelineMatcher("67' Yellow Card – Salah (Liverpool)"))
      ).toBeInTheDocument();
    });
  });

  test("does not add event if form is incomplete", async () => {
    arrangeHappyPath();
    renderLiveMatchUpdate();

    await screen.findByRole("heading", { name: /liverpool vs man united/i });

    fireEvent.click(screen.getByText("ADD EVENT"));

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(1);
  });
});
