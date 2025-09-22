import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommentaryItem from "../CommentaryComp/CommentaryItem";
import CommentaryFeed from "../CommentaryComp/CommentaryFeed";
import type { CommentaryEvent } from "../CommentaryComp/types";

describe("Commentary components", () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      value: jest.fn(),
      writable: true,
    });
  });

  test("CommentaryItem formats minutes and tags", () => {
    const event: CommentaryEvent = {
      minute: 92,
      kind: "goal",
      side: "home",
      text: "Late winner",
      detail: "Volley in stoppage time",
    };

    render(<CommentaryItem ev={event} />);
    expect(screen.getByText("90+2’")).toBeInTheDocument();
    expect(screen.getByText("Goal")).toBeInTheDocument();
    expect(screen.getByText(/Volley/)).toBeInTheDocument();
  });

  test("CommentaryItem hides minute for full-time", () => {
    const event: CommentaryEvent = {
      kind: "ft",
      side: "neutral",
      text: "Full-time",
    };

    render(<CommentaryItem ev={event} />);
    expect(screen.getAllByText("Full-time")).not.toHaveLength(0);
    const minute = screen.getByLabelText("Match minute");
    expect(minute.textContent).toBe("");
  });

  test("CommentaryFeed sorts events and toggles autoscroll", async () => {
    const user = userEvent.setup();
    const events: CommentaryEvent[] = [
      { minute: 15, kind: "card", text: "Booking", side: "away" },
      { minute: 45, kind: "ht", text: "Half-time" },
      { minute: 3, kind: "goal", text: "Early goal", side: "home" },
    ];

    render(
      <CommentaryFeed
        loading={false}
        error={null}
        events={events}
        matchId="123"
        latestFirst
      />
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0].textContent).toContain("Half-time");

    const chk = screen.getByRole("checkbox");
    await user.click(chk);
    expect(chk).not.toBeChecked();
  });

  test("CommentaryFeed shows loading and error states", () => {
    render(
      <CommentaryFeed
        loading
        error="Boom"
        events={[]}
        matchId="id"
      />
    );

    expect(screen.getByText(/Loading commentary/)).toBeInTheDocument();
    expect(screen.getByText("Boom")).toBeInTheDocument();
  });
});
