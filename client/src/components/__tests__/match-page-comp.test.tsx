import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router-dom";
import MatchCard from "../MatchPageComp/MatchCard";
import MatchList from "../MatchPageComp/MatchList";
import MatchForm from "../MatchPageComp/MatchForm";
import { renderWithUser } from "../../Tests/test-utils";

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});

describe("Match page components", () => {
const originalFetch = global.fetch;

const resolveUrl = (input: RequestInfo): string => {
  if (typeof input === "string") return input;
  if (typeof (input as Request).url === "string") return (input as Request).url;
  return input.toString();
};

  beforeEach(() => {
    global.fetch = jest.fn() as any;
    (useNavigate as jest.Mock).mockReturnValue(jest.fn());
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

    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo, init?: RequestInit) => {
      const url = resolveUrl(input);
      if (url.endsWith("/teams") && (!init || !init.method)) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url.endsWith("/names")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ username: "Alice" }, { username: "Bob" }],
        });
      }
      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    });

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

    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo, init?: RequestInit) => {
      const url = resolveUrl(input);
      if (url.endsWith("/teams") && (!init || !init.method)) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    });

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

  test("MatchForm pre-fills fields from CSV data", async () => {
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.endsWith("/teams") && (!init || !init.method)) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    });

    const csvData = {
      team1: "Arsenal ",
      team2: " Chelsea",
      date: "2024-03-10",
      time: "18:45",
      duration: "105 ",
      lineupTeam1: "Alice; Bob ;",
      lineupTeam2: "Charlie;Dave",
    };

    renderWithUser(
      <MemoryRouter>
        <MatchForm onCancel={jest.fn()} csvData={csvData} />
      </MemoryRouter>
    );

    const [csvTeam1Input, csvTeam2Input] = screen.getAllByPlaceholderText("Enter Team Name");
    expect(csvTeam1Input).toHaveValue("Arsenal ");
    expect(csvTeam2Input).toHaveValue(" Chelsea");
    expect(screen.getByDisplayValue("2024-03-10")).toBeInTheDocument();
    expect(screen.getByDisplayValue("18:45")).toBeInTheDocument();
    expect(screen.getByDisplayValue("105")).toBeInTheDocument();
    expect(screen.getAllByText("Saved lineup")[0]).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.getByText("Dave")).toBeInTheDocument();
  });

  test("MatchForm loads match details when editing an existing match", async () => {
    const matchResponse = {
      home_team: { name: "Arsenal" },
      away_team: { name: "Chelsea" },
      utc_kickoff: "2024-04-05 20:15:00",
      notes_json: {
        duration: 92,
        privacy: "private",
        invitedUsers: ["Bob"],
        lineupTeam1: [" Saka ", "Odegaard", null],
        lineupTeam2: ["Palmer", " ", "Gallagher"],
      },
    };

    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo, init?: RequestInit) => {
      const url = resolveUrl(input);
      if (url.endsWith("/teams") && (!init || !init.method)) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: "Arsenal" },
            { id: 2, name: "Chelsea" },
          ],
        });
      }
      if (url.includes("/matches/55")) {
        return Promise.resolve({ ok: true, json: async () => matchResponse });
      }
      if (url.endsWith("/names")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ username: "Alice" }, { username: "Bob" }],
        });
      }
      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    });

    renderWithUser(
      <MemoryRouter>
        <MatchForm onCancel={jest.fn()} matchId={55} />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getAllByPlaceholderText("Enter Team Name")[0]).toHaveValue("Arsenal"));

    expect(screen.getAllByPlaceholderText("Enter Team Name")[1]).toHaveValue("Chelsea");
    expect(screen.getByDisplayValue("2024-04-05")).toBeInTheDocument();
    const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
    await waitFor(() => expect(timeInput?.value).toMatch(/\d{2}:\d{2}/));
    expect(screen.getByDisplayValue("92")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "PRIVATE" })).toBeChecked();
    expect(screen.getByText("Saka")).toBeInTheDocument();
    expect(screen.getByText("Odegaard")).toBeInTheDocument();
    expect(screen.getByText("Palmer")).toBeInTheDocument();
    expect(screen.getByText("Gallagher")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  test("MatchForm alerts when the user is not logged in", async () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => undefined);
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    renderWithUser(
      <MemoryRouter>
        <MatchForm onCancel={jest.fn()} />
      </MemoryRouter>,
      { user: null }
    );

    await user.click(screen.getByRole("button", { name: /CREATE MATCH/i }));

    expect(alertSpy).toHaveBeenCalledWith(
      "You must be logged in to create or edit a match"
    );
    alertSpy.mockRestore();
  });

  test("MatchForm handles invite selection and removal", async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo, init?: RequestInit) => {
      const url = resolveUrl(input);
      if (url.endsWith("/teams") && (!init || !init.method)) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url.endsWith("/names")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ username: "Alice" }, { username: "Bob" }],
        });
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    renderWithUser(
      <MemoryRouter>
        <MatchForm onCancel={jest.fn()} />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("radio", { name: "PRIVATE" }));
    await waitFor(() =>
      expect(
        (global.fetch as jest.Mock).mock.calls.some(([req]) => resolveUrl(req).includes("/names"))
      ).toBe(true)
    );

    const addButton = screen.getByRole("button", { name: "ADD USERS" });
    await user.click(addButton);
    expect(screen.getByRole("button", { name: "Remove Alice" })).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox"), "Bob");
    await user.click(addButton);
    expect(screen.getByRole("button", { name: "Remove Bob" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove Alice" }));
    expect(screen.queryByRole("button", { name: "Remove Alice" })).toBeNull();
  });

  test("MatchForm surfaces an alert when saving the match fails", async () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => undefined);
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo, init?: RequestInit) => {
      const url = resolveUrl(input);
      if (url.endsWith("/teams") && (!init || !init.method)) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url.endsWith("/teams") && init?.method === "POST") {
        return Promise.resolve({ ok: false, json: async () => ({ error: "nope" }) });
      }
      return Promise.resolve({ ok: false, json: async () => ({ error: "nope" }) });
    });

    const csvData = {
      team1: "Arsenal",
      team2: "Chelsea",
      date: "2024-06-01",
      time: "16:00",
      duration: "90",
      lineupTeam1: "A;B",
      lineupTeam2: "C",
    };

    renderWithUser(
      <MemoryRouter>
        <MatchForm onCancel={jest.fn()} csvData={csvData} />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getAllByPlaceholderText("Enter Team Name")[0]).toHaveValue("Arsenal"));
    await user.click(screen.getByRole("button", { name: /CREATE MATCH/i }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    alertSpy.mockRestore();
  });
});
