// src/Tests/Home.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// SUT
import Home from "../pages/home";

// ✅ mock heavy child components so we don’t trigger API calls
jest.mock(
  "../components/HomePageComp/LiveLeagueGames/LiveLeagueGames",
  () => () => <div>Mock LiveLeagueGames</div>
);
jest.mock(
  "../components/HomePageComp/PastLeagueGames/PastLeagueGames",
  () => () => <div>Mock PastLeagueGames</div>
);
jest.mock("../components/HomePageComp/LeagueTable/LeagueTable", () => () => (
  <div>Mock LeagueTable</div>
));
jest.mock("../components/HomePageComp/LastestNews/LastestNews", () => () => (
  <div>Mock LatestNews</div>
));
jest.mock(
  "../components/HomePageComp/LiveStreamsCTA/LiveStreamsCTA",
  () => () => <div>Mock LiveStreamsCTA</div>
);
jest.mock("../components/HomePageComp/Footer/Footer", () => () => (
  <div>Mock Footer</div>
));
jest.mock(
  "../components/HomePageComp/TopPerformersCard/TopPerformersCard",
  () => () => <div>Mock TopPerformersCard</div>
);

describe("Home Page", () => {
  test("renders all main sections", () => {
    render(<Home />);

    expect(screen.getByText("Mock LiveLeagueGames")).toBeInTheDocument();
    expect(screen.getByText("Mock PastLeagueGames")).toBeInTheDocument();
    expect(screen.getByText("Mock LeagueTable")).toBeInTheDocument();
    expect(screen.getByText("Mock LatestNews")).toBeInTheDocument();
    expect(screen.getByText("Mock LiveStreamsCTA")).toBeInTheDocument();
    expect(screen.getByText("Mock Footer")).toBeInTheDocument();
    expect(screen.getByText("Mock TopPerformersCard")).toBeInTheDocument();
  });
});
