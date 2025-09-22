import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import StatsBar from "../StatsBar/StatsBar";

describe("StatsBar", () => {
  test("computes percentage when not provided", () => {
    render(<StatsBar label="Shots" leftValue={3} rightValue={1} />);

    const bar = screen.getByLabelText(/shots bar/i) as HTMLElement;
    const [leftFill, rightFill] = Array.from(bar.children) as HTMLElement[];

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(leftFill.style.width).toBe("75%");
    expect(rightFill.style.width).toBe("25%");
  });

  test("clamps bad percent values to sane defaults", () => {
    render(<StatsBar label="Possession" leftPercent={150} />);

    const bar = screen.getByLabelText(/possession bar/i) as HTMLElement;
    const [leftFill, rightFill] = Array.from(bar.children) as HTMLElement[];

    expect(leftFill.style.width).toBe("100%");
    expect(rightFill.style.width).toBe("0%");
    expect(screen.getAllByText("–")).toHaveLength(2);
  });
});
