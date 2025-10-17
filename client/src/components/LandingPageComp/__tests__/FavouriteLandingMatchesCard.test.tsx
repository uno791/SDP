import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import FavouriteLandingMatchesCard from "../FavouriteLandingMatchesCard";
import { UserContext } from "../../../Users/UserContext";
import axios from "axios";

const mockPastMatchCard = jest.fn(
  ({ emptyMessage, teamNames }: { emptyMessage: string; teamNames: string[] }) => (
    <div data-testid="past-card">
      <span data-testid="empty-message">{emptyMessage}</span>
      <span data-testid="team-names">{teamNames.join(",")}</span>
    </div>
  )
);

jest.mock("../PastMatchCard", () => ({
  __esModule: true,
  default: (props: any) => mockPastMatchCard(props),
}));

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const renderWithUser = (user: { id: string } | null) =>
  render(
    <UserContext.Provider
      value={{
        user,
        setUser: jest.fn(),
        username: user?.id ?? "",
        setUsername: jest.fn(),
      }}
    >
      <FavouriteLandingMatchesCard league="eng1" />
    </UserContext.Provider>
  );

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("FavouriteLandingMatchesCard", () => {
  beforeEach(() => {
    mockPastMatchCard.mockClear();
    mockedAxios.get.mockReset();
  });

  it("shows sign-in prompt when no user is present", async () => {
    renderWithUser(null);

    await waitFor(() =>
      expect(mockPastMatchCard).toHaveBeenCalledWith(
        expect.objectContaining({
          emptyMessage: "Sign in and follow teams to see favourite matches here.",
          teamNames: [],
        })
      )
    );

    expect(
      screen.getByText(
        "Sign in and follow teams to see favourite matches here."
      )
    ).toBeInTheDocument();
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it("fetches team names and deduplicates results", async () => {
    mockedAxios.get.mockResolvedValue({
      data: [
        { team_name: "Team A" },
        { teamName: "   Team B   " },
        { name: "Team A" },
        { name: " " },
        { team: { name: "Team C" } },
      ],
    });

    renderWithUser({ id: "user-1" });

    expect(
      screen.getByText("Loading favourite teams…")
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(mockPastMatchCard).toHaveBeenCalledWith(
        expect.objectContaining({
          teamNames: ["Team A", "Team B", "Team C"],
          emptyMessage: "No favourite team matches.",
        })
      )
    );

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringMatching(/favourite-teams\/user-1$/)
    );
  });

  it("shows error message when fetch fails", async () => {
    mockedAxios.get.mockRejectedValue(new Error("network down"));

    renderWithUser({ id: "user-2" });

    await waitFor(() =>
      expect(mockPastMatchCard).toHaveBeenCalledWith(
        expect.objectContaining({
          emptyMessage: "network down",
          teamNames: [],
        })
      )
    );
  });

  it("cancels updates when component unmounts before request resolves", async () => {
    const deferred = createDeferred<{ data: any[] }>();
    mockedAxios.get.mockReturnValue(deferred.promise);

    const { unmount } = renderWithUser({ id: "user-3" });

    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());

    unmount();

    await act(async () => {
      deferred.resolve({ data: [{ team_name: "Should Not Matter" }] });
      await deferred.promise;
    });

    expect(mockPastMatchCard).not.toHaveBeenCalled();
  });
});
