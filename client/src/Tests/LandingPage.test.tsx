import React from "react";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { MemoryRouter } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import { UserContext } from "../Users/UserContext";

// Mock framer-motion hooks + components
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useScroll: () => ({ scrollY: { current: 0 } }),
  useTransform: (_value: unknown, _input: number[], output: number[]) =>
    output[0] ?? 0,
}));

const headerPropsSpy: any[] = [];
jest.mock("../components/LandingPageComp/Layout/Header", () =>
  function MockHeader(props: { onOpenMenu: () => void }) {
    headerPropsSpy.push(props);
    return (
      <button onClick={() => props.onOpenMenu()} aria-label="Open menu">
        Header Mock
      </button>
    );
  }
);

const burgerPropsSpy: any[] = [];
jest.mock("../components/LandingPageComp/Layout/BurgerMenu", () =>
  function MockBurgerMenu(props: { open: boolean; onClose: () => void }) {
    burgerPropsSpy.push(props);
    if (!props.open) return null;
    return (
      <div data-testid="burger-menu">
        <span>Menu open</span>
        <button onClick={() => props.onClose()} aria-label="Close menu">
          Close
        </button>
      </div>
    );
  }
);

jest.mock("../components/LandingPageComp/LeagueTable", () => () => (
  <div data-testid="LeagueTable">LeagueTable</div>
));
jest.mock("../components/LandingPageComp/LiveMatchCard", () => () => (
  <div data-testid="LiveMatchCard">LiveMatchCard</div>
));
jest.mock("../components/LandingPageComp/PastMatchCard", () => () => (
  <div data-testid="PastMatchCard">PastMatchCard</div>
));
jest.mock("../components/LandingPageComp/NewsCard", () => () => (
  <div data-testid="NewsCard">NewsCard</div>
));
jest.mock("../components/LandingPageComp/MarqueeWide", () => ({ words }: any) => (
  <div data-testid="MarqueeWide">Marquee {words.join(",")}</div>
));
jest.mock("../components/LandingPageComp/ThreeFootball", () => () => (
  <div data-testid="ThreeFootball">ThreeFootball</div>
));
jest.mock("../components/LandingPageComp/Layout/Loader3D", () => () => (
  <div role="status" data-testid="landing-loader">
    Loader3D
  </div>
));
jest.mock("../components/LandingPageComp/PremierLeagueTable", () => () => (
  <div data-testid="PremierLeagueTable">PremierLeagueTable</div>
));

describe("LandingPage", () => {
  const getUserContextValue = () => ({
    user: null,
    setUser: jest.fn(),
    username: "",
    setUsername: jest.fn(),
  });

  const renderWithProviders = () =>
    render(
      <UserContext.Provider value={getUserContextValue()}>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </UserContext.Provider>
    );

  beforeEach(() => {
    headerPropsSpy.length = 0;
    burgerPropsSpy.length = 0;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("shows loader initially and hides after timeout", async () => {
    jest.useFakeTimers();
    renderWithProviders();

    expect(screen.getByTestId("landing-loader")).toBeInTheDocument();

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() =>
      expect(screen.queryByTestId("landing-loader")).not.toBeInTheDocument()
    );
  });

  test("opens and closes burger menu via header callback and renders sections", async () => {
    jest.useFakeTimers();
    renderWithProviders();

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() =>
      expect(screen.queryByTestId("landing-loader")).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    expect(screen.getByTestId("burger-menu")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close menu/i }));
    await waitFor(() =>
      expect(screen.queryByTestId("burger-menu")).not.toBeInTheDocument()
    );

    expect(screen.getByTestId("LiveMatchCard")).toBeInTheDocument();
    expect(screen.getAllByTestId("PastMatchCard").length).toBeGreaterThan(0);
    expect(screen.getByTestId("NewsCard")).toBeInTheDocument();
    expect(screen.getByTestId("ThreeFootball")).toBeInTheDocument();
    expect(screen.getByTestId("PremierLeagueTable")).toBeInTheDocument();
  });
});
