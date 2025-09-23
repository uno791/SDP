import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LiveStreamsCTA from "../LiveStreamsCTA/LiveStreamsCTA";

describe("LiveStreamsCTA", () => {
  test("highlights the live streams CTA", () => {
    render(<LiveStreamsCTA />);

    expect(screen.getByText(/Live Streams/i)).toBeInTheDocument();
    expect(screen.getByText("📺")).toBeInTheDocument();
  });
});
