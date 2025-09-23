import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Ball } from "../pages/ball";
import { House } from "../pages/house";

describe("Misc standalone pages", () => {
  test("Ball component renders expected copy", () => {
    render(<Ball />);
    expect(screen.getByRole("heading", { name: /Ball Component/i })).toBeInTheDocument();
    expect(screen.getByText(/This is not the Ball component/i)).toBeInTheDocument();
  });

  test("House component renders expected copy", () => {
    render(<House />);
    expect(screen.getByRole("heading", { name: /House Component/i })).toBeInTheDocument();
    expect(screen.getByText(/This is the House component/i)).toBeInTheDocument();
  });
});
