import { renderWithUser } from "../../Tests/test-utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";

import FavouritesPage from "../FavouritesPage";
import { fetchEplStandings } from "../../api/espn";

jest.mock("axios");
jest.mock("../../api/espn", () => ({
  fetchEplStandings: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockFetchStandings =
  fetchEplStandings as jest.MockedFunction<typeof fetchEplStandings>;

const teamsResponse = [
  { id: 1, name: "Arsenal" },
  { id: 2, name: "Chelsea" },
  { id: 99, name: "Some Other Club" },
];

const initialFavourites = [
  { team_id: 1, team_name: "Arsenal", logo: null },
];

describe("FavouritesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchStandings.mockResolvedValue([
      { team: "Arsenal", pos: 1, pts: 30 },
      { team: "Chelsea", pos: 2, pts: 28 },
    ] as any);
  });

  test("renders favourite teams and available follow options", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: teamsResponse })
      .mockResolvedValueOnce({ data: initialFavourites });

    renderWithUser(<FavouritesPage />, {
      user: { id: "user-1", username: "Pat" },
    });

    expect(await screen.findByText(/Your Favourite Teams/i)).toBeInTheDocument();
    const favouriteTeams = await screen.findAllByText(/Arsenal/i);
    expect(favouriteTeams.length).toBeGreaterThan(0);
    expect(screen.getByText(/#1/)).toBeInTheDocument();
    expect(screen.getByText(/30 pts/)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /^Follow$/i })).toBeInTheDocument();
  });

  test("allows following an additional team", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: teamsResponse })
      .mockResolvedValueOnce({ data: initialFavourites })
      .mockResolvedValueOnce({
        data: [
          { team_id: 1, team_name: "Arsenal", logo: null },
          { team_id: 2, team_name: "Chelsea", logo: null },
        ],
      });

    mockedAxios.post.mockResolvedValueOnce({ data: {} });

    const user = userEvent.setup();
    renderWithUser(<FavouritesPage />, {
      user: { id: "user-1", username: "Pat" },
    });

    const followButton = await screen.findByRole("button", { name: /^Follow$/i });
    await user.click(followButton);

    await waitFor(() => expect(mockedAxios.post).toHaveBeenCalledTimes(1));
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("/favourite-teams"),
      { userId: "user-1", teamId: 2 }
    );

    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: /Unfollow/i })).toHaveLength(2)
    );
    expect(screen.getAllByText(/Chelsea/).length).toBeGreaterThan(0);
  });
});
