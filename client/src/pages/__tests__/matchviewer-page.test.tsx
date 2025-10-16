import { render, screen } from "@testing-library/react";

import MatchViewer from "../MatchViewer";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useSearchParams: () => [new URLSearchParams("")],
}));

describe("MatchViewer page", () => {
  it("requires query id", () => {
    render(<MatchViewer />);
    const messages = screen.getAllByText(
      (_, node) => node?.textContent === "Missing ?id in URL"
    );
    expect(messages.length).toBeGreaterThan(0);
  });
});
