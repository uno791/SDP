import { render, screen } from "@testing-library/react";
import CommentaryItem from "../CommentaryItem";
import type { CommentaryEvent } from "../types";

describe("CommentaryItem", () => {
  const base: CommentaryEvent = {
    kind: "goal",
    minute: 12,
    text: "Goal for the hosts",
    side: "home",
  };

  it("shows stoppage time with the 90+ format and goal label", () => {
    const ev: CommentaryEvent = {
      ...base,
      minute: 92,
      text: "Late winner",
    };

    render(
      <ul>
        <CommentaryItem ev={ev} />
      </ul>
    );

    expect(screen.getByLabelText("Match minute")).toHaveTextContent("90+2’");
    expect(screen.getByText("Goal")).toBeInTheDocument();
    expect(screen.getByRole("listitem").className).toContain("home");
  });

  it("prefers the supplied minute text and renders detail lines", () => {
    const ev: CommentaryEvent = {
      ...base,
      kind: "blocked",
      minute: undefined,
      minuteText: "45+1’",
      text: "Effort denied",
      detail: "Huge save from the keeper",
      side: "away",
    };

    render(
      <ul>
        <CommentaryItem ev={ev} />
      </ul>
    );

    expect(screen.getByLabelText("Match minute")).toHaveTextContent("45+1’");
    expect(screen.getByText("Blocked")).toBeInTheDocument();
    expect(screen.getByText(/Huge save/)).toBeInTheDocument();
    expect(screen.getByRole("listitem").className).toContain("away");
  });

  it("falls back to an em dash for missing minute values", () => {
    const ev: CommentaryEvent = {
      ...base,
      kind: "chance",
      minute: undefined,
      minuteText: undefined,
      text: "Half-chance",
      side: "neutral",
    };

    render(
      <ul>
        <CommentaryItem ev={ev} />
      </ul>
    );

    expect(screen.getByLabelText("Match minute")).toHaveTextContent("—");
    expect(screen.getByRole("listitem").className).toContain("neutral");
  });

  it("hides minute badge for full-time updates", () => {
    const ev: CommentaryEvent = {
      ...base,
      kind: "ft",
      minute: 95,
      text: "Full-time whistle",
    };

    render(
      <ul>
        <CommentaryItem ev={ev} />
      </ul>
    );

    expect(screen.getByLabelText("Match minute")).toHaveTextContent("");
    expect(screen.getByText("Full-time")).toBeInTheDocument();
  });
});
