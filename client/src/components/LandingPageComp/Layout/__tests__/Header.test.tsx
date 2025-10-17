import React from "react";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Header from "../Header";

jest.mock("lucide-react", () => ({
  Menu: () => <span data-testid="menu-icon">menu</span>,
}));

jest.mock("axios", () => ({
  get: jest.fn(),
}));

jest.mock("../../../../Users/UserContext", () => ({
  useUser: jest.fn(),
}));

jest.mock("../../../../config", () => ({
  baseURL: "http://example.com",
}));

jest.mock("../../../../api/espn", () => ({
  fetchScoreboard: jest.fn(),
}));

jest.mock("../../../../utils/favouritesCache", () => ({
  getCachedHighlights: jest.fn(),
  setCachedHighlights: jest.fn(),
  subscribeToFavouritesUpdates: jest.fn(() => () => undefined),
}));

jest.mock("../Header.module.css", () => new Proxy({}, {
  get: (_target, key: string) => key,
}));

const useUser = require("../../../../Users/UserContext").useUser as jest.Mock;
const axiosGet = require("axios").get as jest.Mock;
const fetchScoreboard = require("../../../../api/espn").fetchScoreboard as jest.Mock;
const {
  getCachedHighlights,
  setCachedHighlights,
  subscribeToFavouritesUpdates,
} = require("../../../../utils/favouritesCache") as {
  getCachedHighlights: jest.Mock;
  setCachedHighlights: jest.Mock;
  subscribeToFavouritesUpdates: jest.Mock;
};

describe("Landing Header", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.resetAllMocks();
    subscribeToFavouritesUpdates.mockReturnValue(() => undefined);
    process.env.NODE_ENV = originalEnv;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("renders sign-up call to action when no user is present", () => {
    useUser.mockReturnValue({ user: null, username: null });
    render(
      <MemoryRouter>
        <Header onOpenMenu={jest.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /footbook/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /sign up to follow your teams/i })).toHaveAttribute(
      "href",
      "/signup"
    );
    expect(axiosGet).not.toHaveBeenCalled();
  });

  it("uses cached highlights immediately when available", async () => {
    process.env.NODE_ENV = "development";
    useUser.mockReturnValue({
      user: { id: 88, username: "Sam Supporter" },
      username: "Sam",
    });
    getCachedHighlights.mockReturnValue({
      highlights: [
        { key: "arsenal-last", teamName: "Arsenal", label: "Last", text: "Won 2-1 vs Spurs" },
      ],
      teamNames: ["Arsenal"],
    });
    const unsubscribe = jest.fn();
    subscribeToFavouritesUpdates.mockReturnValue(unsubscribe);

    render(
      <MemoryRouter>
        <Header onOpenMenu={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Arsenal")).toBeInTheDocument());
    expect(screen.getByText("Last")).toBeInTheDocument();
    expect(screen.getByText(/Won 2-1 vs Spurs/i)).toBeInTheDocument();
    expect(axiosGet).not.toHaveBeenCalled();
    expect(unsubscribe).not.toHaveBeenCalled();
  });

  it("fetches highlights when cache is empty and updates on subscription events", async () => {
    process.env.NODE_ENV = "development";
    const user = { id: 42, username: "Taylor Swift" };
    useUser.mockReturnValue({ user, username: "Taylor" });
    getCachedHighlights.mockReturnValueOnce(undefined);

    axiosGet.mockResolvedValue({
      data: [
        { team_name: "Arsenal FC" },
        { name: "Barcelona" },
      ],
    });

    const scoreboardResponse = {
      events: [
        {
          id: "match-1",
          date: new Date("2024-02-01T19:00:00Z").toISOString(),
          status: { type: { state: "post" } },
          competitions: [
            {
              competitors: [
                { team: { displayName: "Arsenal" }, score: "3" },
                { team: { displayName: "Chelsea" }, score: "1" },
              ],
            },
          ],
        },
        {
          id: "match-2",
          date: new Date("2024-02-03T17:30:00Z").toISOString(),
          status: { type: { state: "pre" } },
          competitions: [
            {
              competitors: [
                { team: { displayName: "Barcelona" }, score: null },
                { team: { displayName: "Real Madrid" }, score: null },
              ],
            },
          ],
        },
      ],
    };

    fetchScoreboard.mockResolvedValue(scoreboardResponse);

    let subscriptionCallback: ((detail: any) => void) | undefined;
    subscribeToFavouritesUpdates.mockImplementation((listener: (detail: any) => void) => {
      subscriptionCallback = listener;
      return jest.fn();
    });

    const openMenu = jest.fn();
    render(
      <MemoryRouter>
        <Header onOpenMenu={openMenu} />
      </MemoryRouter>
    );

    await waitFor(() => expect(setCachedHighlights).toHaveBeenCalledTimes(1));
    expect(axiosGet).toHaveBeenCalledWith("http://example.com/favourite-teams/42");
    const cachedPayload = setCachedHighlights.mock.calls[0][1];
    expect(cachedPayload.teamNames).toEqual(["Arsenal FC", "Barcelona"]);
    expect(cachedPayload.highlights).toHaveLength(2);
    expect(
      cachedPayload.highlights.some((item: any) => item.label === "Last")
    ).toBe(true);
    expect(
      cachedPayload.highlights.some((item: any) => item.label === "Next")
    ).toBe(true);

    await waitFor(() => expect(screen.getByText("Arsenal FC")).toBeInTheDocument());
    expect(screen.getByText("Last")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /open menu/i }));
    expect(openMenu).toHaveBeenCalled();

    await act(async () => {
      subscriptionCallback?.({ userId: 42, reason: "refresh", at: Date.now() });
    });

    await waitFor(() => expect(setCachedHighlights).toHaveBeenCalledTimes(2));
    expect(axiosGet).toHaveBeenCalledTimes(2);
  });
});
