import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import WhatIsFootbook from "../pages/WhatIsFootbook";

jest.mock("../pages/WhatIsFootbook.module.css", () => new Proxy({}, {
  get: (_, key: string) => key,
}));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/discover"]}>
      <Routes>
        <Route path="/discover" element={<WhatIsFootbook />} />
      </Routes>
    </MemoryRouter>
  );

describe("WhatIsFootbook page", () => {
  it("renders hero copy and primary calls to action", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: /Your All-in-One Football Companion/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Footbook brings fixtures/i)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Create an account/i })).toHaveAttribute(
      "href",
      "/signup"
    );
    expect(screen.getByRole("link", { name: /Back to matches/i })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("displays overview cards, feature anchors, and timeline steps", () => {
    renderPage();

    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(8);

    const firstCard = cards[0];
    expect(within(firstCard).getByText(/Live coverage that feels present/i)).toBeInTheDocument();
    expect(within(firstCard).getByText(/50\+ data points per game/i)).toBeInTheDocument();

    expect(screen.getByRole("navigation", { name: /Footbook feature navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /How it works/i })).toHaveAttribute("href", "#journey");

    const ctaLink = screen.getByRole("link", { name: /Open Create Match/i });
    expect(ctaLink).toHaveAttribute("href", "/create-match");

    const watchalongLink = screen.getByRole("link", { name: /Jump into a watchalong/i });
    expect(watchalongLink).toHaveAttribute("href", "/watchalongs");

    const steps = screen.getAllByText(/^[1-4]$/);
    expect(steps).toHaveLength(4);
    expect(steps.map((el) => el.textContent)).toEqual(["1", "2", "3", "4"]);

    expect(screen.getByText(/Casual Fans/i)).toBeInTheDocument();
    expect(screen.getByText(/Match Organisers/i)).toBeInTheDocument();
    expect(screen.getByText(/Dedicated Supporters/i)).toBeInTheDocument();
  });
});
