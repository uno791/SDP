import { screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import axios from "axios";

import LiveMatchUpdate from "../pages/MatchPages/LiveMatchUpdate";
import { renderWithUser } from "./test-utils";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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
    notes_json: {
      lineupTeam1: ["Salah", "Mac Allister"],
      lineupTeam2: ["Rashford", "Fernandes"],
    },
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
    mockNavigate.mockReset();
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
          team_id: matchData.home_team?.id,
          player_name: "Salah",
        },
      ];
      return { data: {} };
    });

    renderLiveMatchUpdate();
    await screen.findByRole("heading", {
      name: /liverpool vs man united/i,
    });

    const eventTypeSelect = screen
      .getByText("Event Type")
      .closest("select") as HTMLSelectElement;
    const teamSelect = screen
      .getByText("Team")
      .closest("select") as HTMLSelectElement;
    const playerSelect = screen
      .getByText("Select Player")
      .closest("select") as HTMLSelectElement;

    await user.selectOptions(eventTypeSelect, "yellow_card");
    await user.selectOptions(teamSelect, String(matchData.home_team?.id));

    await waitFor(() => {
      expect(playerSelect.querySelectorAll("option")).toHaveLength(3);
    });

    await user.selectOptions(playerSelect, "Salah");

    await user.type(screen.getByPlaceholderText("Minute"), "67");

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

  test("logs an error when fetching reports fails", async () => {
    const matchData = createBaseMatch();
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.endsWith("/reports")) {
        return Promise.reject(new Error("reports down"));
      }
      return Promise.resolve({ data: { match: matchData } });
    });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    renderLiveMatchUpdate();

    await screen.findByRole("heading", { name: /liverpool vs man united/i });
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Failed to fetch reports:",
        expect.any(Error)
      );
    });

    errorSpy.mockRestore();
  });

  test("starts and clears match polling interval outside test env", async () => {
    const originalEnv = process.env.NODE_ENV;
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");

    try {
      process.env.NODE_ENV = "production";

      arrangeHappyPath();
      const { unmount } = renderLiveMatchUpdate();

      await screen.findByRole("heading", { name: /liverpool vs man united/i });
      const before = mockedAxios.get.mock.calls.filter(([url]) =>
        url.endsWith("/matches/1")
      ).length;

      jest.advanceTimersByTime(10_000);

      await waitFor(() => {
        const after = mockedAxios.get.mock.calls.filter(([url]) =>
          url.endsWith("/matches/1")
        ).length;
        expect(after).toBeGreaterThan(before);
      });

      unmount();
      expect(clearIntervalSpy).toHaveBeenCalled();
    } finally {
      clearIntervalSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    }
  });

  test("registers live minute ticker while match is in progress", async () => {
    const originalEnv = process.env.NODE_ENV;
    const setIntervalSpy = jest.spyOn(global, "setInterval");
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");

    try {
      process.env.NODE_ENV = "production";

      arrangeHappyPath();
      const { unmount } = renderLiveMatchUpdate();

      await screen.findByText(/67'/);

      const minuteCallIndex = setIntervalSpy.mock.calls.findIndex(
        ([, delay]) => delay === 60_000
      );
      expect(minuteCallIndex).toBeGreaterThanOrEqual(0);

      const minuteIntervalId =
        setIntervalSpy.mock.results[minuteCallIndex]?.value;
      expect(typeof minuteIntervalId).toBe("number");

      unmount();
      expect(clearIntervalSpy).toHaveBeenCalledWith(minuteIntervalId);
    } finally {
      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    }
  });

  test("updates available players for away team and clears for unknown team", async () => {
    const matchData = arrangeHappyPath();
    renderLiveMatchUpdate();

    await screen.findByRole("heading", { name: /liverpool vs man united/i });

    const teamSelect = screen
      .getByText("Team")
      .closest("select") as HTMLSelectElement;
    const playerSelect = screen
      .getByText("Select Player")
      .closest("select") as HTMLSelectElement;

    fireEvent.change(teamSelect, {
      target: { value: String(matchData.away_team?.id) },
    });

    await waitFor(() => {
      const values = Array.from(playerSelect.options).map((opt) => opt.value);
      expect(values).toEqual(["", "Rashford", "Fernandes"]);
    });

    fireEvent.change(teamSelect, { target: { value: "999" } });

    await waitFor(() => {
      const values = Array.from(playerSelect.options).map((opt) => opt.value);
      expect(values).toEqual([""]);
    });
  });

  test("logs when adding an event fails", async () => {
    const matchData = arrangeHappyPath();
    mockedAxios.post.mockRejectedValue(new Error("add failed"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    renderLiveMatchUpdate();
    await screen.findByRole("heading", { name: /liverpool vs man united/i });

    const eventTypeSelect = screen
      .getByText("Event Type")
      .closest("select") as HTMLSelectElement;
    const teamSelect = screen
      .getByText("Team")
      .closest("select") as HTMLSelectElement;
    const playerSelect = screen
      .getByText("Select Player")
      .closest("select") as HTMLSelectElement;

    await user.selectOptions(eventTypeSelect, "goal");
    await user.selectOptions(teamSelect, String(matchData.home_team?.id));

    await waitFor(() => {
      expect(playerSelect.querySelectorAll("option")).toHaveLength(3);
    });

    await user.selectOptions(playerSelect, "Salah");
    await user.click(screen.getByText("ADD EVENT"));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Failed to add event:",
        expect.any(Error)
      );
    });

    errorSpy.mockRestore();
  });

  test("logs when deleting an event fails", async () => {
    arrangeHappyPath();
    mockedAxios.delete.mockRejectedValue(new Error("delete failed"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    renderLiveMatchUpdate();

    const deleteButton = await screen.findByRole("button", {
      name: /delete 55' goal/i,
    });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Failed to delete event:",
        expect.any(Error)
      );
    });

    errorSpy.mockRestore();
  });

  test("logs and alerts when finalizing match fails", async () => {
    arrangeHappyPath();
    mockedAxios.post.mockImplementation((url: string) => {
      if (url.endsWith("/finalize")) {
        return Promise.reject({ response: { data: { error: "nope" } } });
      }
      return Promise.resolve({ data: {} });
    });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    renderLiveMatchUpdate();
    await screen.findByRole("heading", { name: /liverpool vs man united/i });

    fireEvent.click(screen.getByText("END MATCH"));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Failed to finalize match:",
        expect.objectContaining({ error: "nope" })
      );
    });
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("Finalize failed")
    );
    expect(mockNavigate).not.toHaveBeenCalledWith("/mymatches");

    errorSpy.mockRestore();
    alertSpy.mockRestore();
  });

  test("logs when extending match fails", async () => {
    arrangeHappyPath();
    mockedAxios.patch.mockRejectedValue(new Error("extend failed"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    renderLiveMatchUpdate();
    await screen.findByRole("heading", { name: /liverpool vs man united/i });

    fireEvent.click(screen.getByText("EXTEND MATCH"));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Failed to extend match:",
        expect.any(Error)
      );
    });

    errorSpy.mockRestore();
  });
});
