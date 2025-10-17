import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import Commentary from "../pages/Commentary";

const mockFetchCommentaryNormalized = jest.fn();

jest.mock("../api/espn", () => ({
  fetchCommentaryNormalized: (...args: unknown[]) =>
    mockFetchCommentaryNormalized(...args),
}));

jest.mock("../components/PlayerStatsComp/MatchNavBar", () => {
  const React = require("react");
  const { useSearchParams } = require("react-router-dom");
  return function MockMatchNavBar() {
    const [sp] = useSearchParams();
    if (!sp.get("id")) return null;
    return <nav data-testid="match-nav">MatchNavBar</nav>;
  };
});

jest.mock("../components/MatchViewerComp/ComicCard", () =>
  ({ children }: { children: React.ReactNode }) => (
    <section data-testid="comic-card">{children}</section>
  )
);

jest.mock("../components/MatchViewerComp/MatchView.module.css", () => ({
  container: "container",
  heading: "heading",
  subheading: "subheading",
  section: "section",
  sectionTitle: "sectionTitle",
}));

jest.mock("../components/CommentaryComp/Commentary.module.css", () => ({
  state: "state",
  error: "error",
  list: "list",
  item: "item",
  home: "home",
  away: "away",
  neutral: "neutral",
  minute: "minute",
  body: "body",
  line1: "line1",
  tag: "tag",
  text: "text",
  detail: "detail",
}));

describe("Commentary page", () => {
  beforeEach(() => {
    mockFetchCommentaryNormalized.mockReset();
  });

  test("shows error when ?id is missing", async () => {
    render(
      <MemoryRouter initialEntries={["/commentary"]}>
        <Routes>
          <Route path="/commentary" element={<Commentary />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(
        screen.getByText(/Failed to load: Missing \?id in URL/i)
      ).toBeInTheDocument()
    );
    expect(mockFetchCommentaryNormalized).not.toHaveBeenCalled();
    expect(screen.queryByTestId("match-nav")).not.toBeInTheDocument();
  });

  test("renders commentary events in latest-first order", async () => {
    const events = [
      {
        sequence: 2,
        kind: "goal" as const,
        minute: 22,
        minuteText: "22'",
        side: "home" as const,
        text: "Goal! Home takes the lead",
        detail: "Assist by Midfielder",
      },
      {
        sequence: 1,
        kind: "card" as const,
        minute: 10,
        minuteText: "10'",
        side: "away" as const,
        text: "Yellow card for Away",
      },
    ];
    mockFetchCommentaryNormalized.mockResolvedValueOnce(events);

    render(
      <MemoryRouter initialEntries={["/commentary?id=123"]}>
        <Routes>
          <Route path="/commentary" element={<Commentary />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading commentary…/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.queryByText(/Loading commentary…/i)).not.toBeInTheDocument()
    );

    expect(screen.getByTestId("match-nav")).toBeInTheDocument();
    const renderedItems = screen.getAllByRole("listitem");
    expect(renderedItems[0]).toHaveTextContent("Goal! Home takes the lead");
    expect(renderedItems[1]).toHaveTextContent("Yellow card for Away");
  });

  test("renders failure message when API rejects", async () => {
    mockFetchCommentaryNormalized.mockRejectedValueOnce(new Error("no feed"));

    render(
      <MemoryRouter initialEntries={["/commentary?id=555"]}>
        <Routes>
          <Route path="/commentary" element={<Commentary />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Failed to load: no feed/i)).toBeInTheDocument()
    );
  });

  test("normalizes minute badges and kind labels", async () => {
    mockFetchCommentaryNormalized.mockResolvedValueOnce([
      {
        sequence: 3,
        kind: "ft" as const,
        minute: 95,
        side: "neutral" as const,
        text: "Final whistle",
      },
      {
        sequence: 2,
        kind: "blocked" as const,
        minute: 92,
        side: "away" as const,
        text: "Shot blocked",
      },
      {
        sequence: 1,
        kind: "goal" as const,
        minute: 45,
        minuteText: "45+2",
        side: "home" as const,
        text: "Goal for Home",
        detail: "Assist by Midfielder",
      },
    ]);

    const { container } = render(
      <MemoryRouter initialEntries={["/commentary?id=999"]}>
        <Routes>
          <Route path="/commentary" element={<Commentary />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.queryByText(/Loading commentary…/i)).not.toBeInTheDocument()
    );

    const minuteCells = Array.from(container.querySelectorAll(".minute")).map(
      (el) => el.textContent?.trim()
    );
    expect(minuteCells).toEqual(["", "90+2’", "45+2"]);

    expect(screen.getByText("Full-time")).toBeInTheDocument();
    expect(screen.getByText("Blocked")).toBeInTheDocument();
    expect(screen.getByText("Goal")).toBeInTheDocument();
    expect(screen.getByText(/Assist by Midfielder/i)).toBeInTheDocument();
  });
});
