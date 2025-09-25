import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import MatchCard from "../MatchPageComp/MatchCard";
import MatchList from "../MatchPageComp/MatchList";
import MatchForm from "../MatchPageComp/MatchForm";
import { renderWithUser } from "../../Tests/test-utils";

describe("Match page components", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ username: "Alice" }, { username: "Bob" }],
    }) as any;
  });

  afterEach(() => {
    (global.fetch as jest.Mock | undefined)?.mockClear();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test("MatchCard renders status and fires callback", async () => {
    const onSeeMore = jest.fn();
    const user = userEvent.setup();

    renderWithUser(
      <MatchCard
        match={{
          id: 1,
          team1: "Foot",
          team2: "Ball",
          score: "2 - 1",
          status: "live",
          minute: 75,
        }}
        onSeeMore={onSeeMore}
      />
    );

    expect(screen.getByText(/Live/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "See More" }));
    expect(onSeeMore).toHaveBeenCalledWith(1);
  });

  test("MatchList renders cards for matches", () => {
    renderWithUser(
      <MatchList
        title="Today"
        matches={[
          {
            id: 2,
            team1: "Home",
            team2: "Away",
            score: "1 - 1",
            status: "finished",
            date: "2024-01-01",
          },
        ]}
      />
    );

    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  test("MatchForm loads usernames and manages lineups", async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();

    renderWithUser(
      <MemoryRouter>
        <MatchForm onCancel={onCancel} />
      </MemoryRouter>
    );

    const userRadio = screen.getByRole("radio", { name: "PRIVATE" });
    await user.click(userRadio);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    // Add lineup for team 1
    await user.click(screen.getAllByRole("button", { name: "ADD LINEUP +" })[0]!);
    const countInputs = screen.getAllByRole("spinbutton");
    await user.clear(countInputs[0]!);
    await user.type(countInputs[0]!, "2");
    await user.click(screen.getByRole("button", { name: "Create Fields" }));

    const textInputs = screen.getAllByPlaceholderText("Player name");
    await user.type(textInputs[0]!, "Alice");
    await user.type(textInputs[1]!, "Bob");
    await user.click(screen.getByRole("button", { name: "Save Lineup" }));

    const savedBlocks = screen.getAllByText("Saved lineup");
    const firstBlock = savedBlocks[0].parentElement as HTMLElement;
    expect(firstBlock).toBeTruthy();
    expect(within(firstBlock).getByText("Alice")).toBeInTheDocument();
    expect(within(firstBlock).getByText("Bob")).toBeInTheDocument();

    // Invite users
    await user.click(screen.getByRole("button", { name: "ADD USERS" }));
    expect(screen.getByRole("button", { name: "Remove Alice" })).toBeInTheDocument();

    // Cancel button should trigger callback
    await user.click(screen.getByRole("button", { name: "CANCEL" }));
    expect(onCancel).toHaveBeenCalled();
  });

  test("MatchForm blocks submission when required data is missing", async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();

    renderWithUser(
      <MemoryRouter>
        <MatchForm onCancel={onCancel} />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /CREATE MATCH/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/team 1 name is required/i);
    expect(alert).toHaveTextContent(/team 2 name is required/i);
    expect(alert).toHaveTextContent(/match date is required/i);
    expect(alert).toHaveTextContent(/kickoff time is required/i);
    expect(alert).toHaveTextContent(/duration is required/i);
    expect(alert).toHaveTextContent(/team 1 must include at least one player/i);
    expect(alert).toHaveTextContent(/team 2 must include at least one player/i);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
