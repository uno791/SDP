import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfilePicture from "../ProfilePageComp/ProfilePicture";
import FavouriteTeams from "../ProfilePageComp/FavouriteTeams";
import AddTeam from "../ProfilePageComp/AddTeam";
import TeamCard from "../ProfilePageComp/TeamCard";
import UsernameDisplay from "../ProfilePageComp/UsernameDisplay";

describe("Profile page components", () => {
  test("ProfilePicture allows picking a new avatar", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();

    render(<ProfilePicture selected="/assets/messi.png" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));

    const ronaldo = screen.getByAltText("Ronaldo");
    await user.click(ronaldo);
    expect(onChange).toHaveBeenCalledWith("/assets/ronaldo.png");
  });

  test("FavouriteTeams toggles edit mode and saves", async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <FavouriteTeams
        teams={[{ team_id: 1, team_name: "Foot FC", logo: "logo.png" }]}
        availableTeams={["Foot FC", "Ball United"]}
        onUpdate={onUpdate}
      />
    );

    expect(screen.getByText("Foot FC")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));

    await user.click(screen.getByLabelText("Ball United"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onUpdate).toHaveBeenCalledWith(["Foot FC", "Ball United"]);
  });

  test("AddTeam forwards selection", async () => {
    const onAdd = jest.fn();
    const user = userEvent.setup();

    render(<AddTeam availableTeams={["One", "Two"]} onAdd={onAdd} />);

    await user.selectOptions(screen.getByRole("combobox"), "Two");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onAdd).toHaveBeenCalledWith("Two");
    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  test("TeamCard and UsernameDisplay render text", async () => {
    const onRemove = jest.fn();
    const user = userEvent.setup();

    render(
      <TeamCard team="Foot FC" onRemove={onRemove} />
    );

    await user.click(screen.getByRole("button", { name: "✕" }));
    expect(onRemove).toHaveBeenCalledWith("Foot FC");

    render(<UsernameDisplay username="Captain" />);
    expect(screen.getByRole("heading", { name: "Captain" })).toBeInTheDocument();
  });
});
