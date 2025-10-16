import { render, screen } from "@testing-library/react";

import CommentaryFeed from "../CommentaryComp/CommentaryFeed";

describe("CommentaryFeed snapshots", () => {
  beforeAll(() => {
    Object.defineProperty(window.HTMLElement.prototype, "scrollTo", {
      value: jest.fn(),
      writable: true,
    });
  });

  it("renders empty state when no events", () => {
    render(
      <CommentaryFeed
        loading={false}
        error={null}
        events={[]}
        matchId="abc"
      />
    );

    expect(screen.getByText(/No commentary available/)).toBeInTheDocument();
  });
});
