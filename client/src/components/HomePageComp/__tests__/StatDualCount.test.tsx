import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import StatDualCount from "../StatDualCount/StatDualCount";

describe("StatDualCount", () => {
  test("renders tags and values and substitutes missing data", () => {
    render(
      <StatDualCount
        label="Shots on Target"
        leftTag="ARS"
        leftValue={7}
        rightTag="MCI"
      />
    );

    expect(screen.getByText("Shots on Target")).toBeInTheDocument();
    expect(screen.getByText(/ARS/i)).toBeInTheDocument();
    expect(screen.getByText(/7/)).toBeInTheDocument();
    expect(screen.getAllByText("–")).toHaveLength(1);
  });
});
