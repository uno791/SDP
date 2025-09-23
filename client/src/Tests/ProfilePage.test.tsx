import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";

// SUT
import ProfilePage from "../pages/ProfilePage";
import FavouriteTeams from "../components/ProfilePageComp/FavouriteTeams";
import ProfilePicture from "../components/ProfilePageComp/ProfilePicture";
import AddTeam from "../components/ProfilePageComp/AddTeam";
import TeamCard from "../components/ProfilePageComp/TeamCard";

// ✅ Mock UserContext
const mockSetUser = jest.fn();
jest.mock("../Users/UserContext", () => ({
  useUser: () => ({
    user: { id: 123, username: "testuser" },
    username: "testuser",
    setUser: mockSetUser,
  }),
}));

// ✅ Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

function renderProfile(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={<ProfilePage />} />
        <Route path="/login" element={<div>Mock LoginPage</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {}); // silence error logs
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  test("renders username and profile picture", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] }); // /teams
    mockedAxios.get.mockResolvedValueOnce({ data: [] }); // /favourites

    renderProfile();

    expect(await screen.findByText("testuser")).toBeInTheDocument();
    expect(screen.getByAltText("Profile")).toBeInTheDocument();
  });

  test("loads favourite teams from backend", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: [{ id: 1, name: "Barcelona" }] })
      .mockResolvedValueOnce({
        data: [{ team_id: 1, team_name: "Barcelona", logo: "barca.png" }],
      });

    renderProfile();

    expect(await screen.findByText("Barcelona")).toBeInTheDocument();
    expect(screen.getByAltText("Barcelona")).toHaveAttribute("src", "barca.png");
  });

  test("updates teams when saving from FavouriteTeams", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: [{ id: 1, name: "Barcelona" }] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: [{ team_id: 1, team_name: "Barcelona", logo: "barca.png" }],
      });

    mockedAxios.post.mockResolvedValueOnce({});

    renderProfile();

    const editButtons = await screen.findAllByText(/edit/i);
    fireEvent.click(editButtons[1]); // FavouriteTeams edit

    const checkbox = await screen.findByLabelText("Barcelona");
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByText(/save/i));

    await waitFor(() =>
      expect(screen.getByText("Barcelona")).toBeInTheDocument()
    );
    expect(mockedAxios.post).toHaveBeenCalled();
  });

  test("sign out clears user and navigates to login page", async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });

    renderProfile();

    fireEvent.click(screen.getByText(/sign out/i));

    expect(mockSetUser).toHaveBeenCalledWith(null);
    expect(await screen.findByText(/mock loginpage/i)).toBeInTheDocument();
  });

  test("handles fetch error gracefully", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("fail"));
    renderProfile();
    await waitFor(() => expect(console.error).toHaveBeenCalled());
  });

  test("handles update teams error gracefully", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: [{ id: 1, name: "Barcelona" }] })
      .mockResolvedValueOnce({ data: [] });
    mockedAxios.post.mockRejectedValueOnce(new Error("update failed"));

    renderProfile();

    const editButtons = await screen.findAllByText(/edit/i);
    fireEvent.click(editButtons[1]);
    fireEvent.click(await screen.findByLabelText("Barcelona"));
    fireEvent.click(screen.getByText(/save/i));

    await waitFor(() => expect(console.error).toHaveBeenCalled());
  });
});

describe("FavouriteTeams component", () => {
  test("can remove a selected team", () => {
    const onUpdate = jest.fn();
    render(
      <FavouriteTeams
        teams={[{ team_id: 1, team_name: "Barcelona" }]}
        onUpdate={onUpdate}
        availableTeams={["Barcelona"]}
      />
    );

    fireEvent.click(screen.getByText("Edit"));
    const checkbox = screen.getByLabelText("Barcelona");
    fireEvent.click(checkbox); // uncheck
    fireEvent.click(screen.getByText("Save"));

    expect(onUpdate).toHaveBeenCalledWith([]);
  });
});

describe("ProfilePicture component", () => {
  test("changes picture when selecting Ronaldo", () => {
    const onChange = jest.fn();
    render(
      <ProfilePicture selected="/assets/messi.png" onChange={onChange} />
    );

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByAltText("Ronaldo"));

    expect(onChange).toHaveBeenCalledWith("/assets/ronaldo.png");
  });
});

describe("AddTeam component", () => {
  test("calls onAdd when adding a team", () => {
    const onAdd = jest.fn();
    render(<AddTeam onAdd={onAdd} availableTeams={["Barcelona"]} />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Barcelona" },
    });
    fireEvent.click(screen.getByText("Add"));

    expect(onAdd).toHaveBeenCalledWith("Barcelona");
  });
});

describe("TeamCard component", () => {
  test("calls onRemove when ✕ is clicked", () => {
    const onRemove = jest.fn();
    render(<TeamCard team="Barcelona" onRemove={onRemove} />);

    fireEvent.click(screen.getByText("✕"));
    expect(onRemove).toHaveBeenCalledWith("Barcelona");
  });
});


/*import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";

// SUT
import ProfilePage from "../pages/ProfilePage";

// ✅ Mock UserContext
const mockSetUser = jest.fn();
jest.mock("../Users/UserContext", () => ({
  useUser: () => ({
    user: { id: 123, username: "testuser" },
    username: "testuser",
    setUser: mockSetUser,
  }),
}));

// ✅ Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

function renderProfile(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={<ProfilePage />} />
        <Route path="/loginpage" element={<div>Mock LoginPage</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders username and profile picture", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] }); // /teams
    mockedAxios.get.mockResolvedValueOnce({ data: [] }); // /favourite-teams/123

    renderProfile();

    expect(await screen.findByText("testuser")).toBeInTheDocument();
    expect(screen.getByAltText("Profile")).toBeInTheDocument();
  });

  test("loads favourite teams from backend", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: [{ id: 1, name: "Barcelona" }] }) // /teams
      .mockResolvedValueOnce({
        data: [{ team_id: 1, team_name: "Barcelona", logo: "barca.png" }],
      }); // /favourite-teams/123

    renderProfile();

    expect(await screen.findByText("Barcelona")).toBeInTheDocument();
    expect(screen.getByAltText("Barcelona")).toHaveAttribute("src", "barca.png");
  });

  test("updates teams when saving from FavouriteTeams", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: [{ id: 1, name: "Barcelona" }] }) // /teams
      .mockResolvedValueOnce({ data: [] }) // initial favourites
      .mockResolvedValueOnce({
        data: [{ team_id: 1, team_name: "Barcelona", logo: "barca.png" }],
      }); // refresh after update

    mockedAxios.post.mockResolvedValueOnce({});

    renderProfile();

    // Enter edit mode
const editButtons = await screen.findAllByText(/edit/i);
fireEvent.click(editButtons[1]); // FavouriteTeams edit

    // Tick Barcelona
    const checkbox = await screen.findByLabelText("Barcelona");
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByText(/save/i));

    await waitFor(() =>
      expect(screen.getByText("Barcelona")).toBeInTheDocument()
    );
    expect(mockedAxios.post).toHaveBeenCalled();
  });

  test("sign out clears user and navigates to login page", async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });

    renderProfile();

    fireEvent.click(screen.getByText(/sign out/i));

    expect(mockSetUser).toHaveBeenCalledWith(null);
    expect(await screen.findByText(/mock loginpage/i)).toBeInTheDocument();
  });
});*/
