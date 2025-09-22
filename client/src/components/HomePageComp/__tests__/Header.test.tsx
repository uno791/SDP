import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Header from "../Header/Header";
import { useUser } from "../../../Users/UserContext";
import { useNavigate } from "react-router-dom";

jest.mock("../../../Users/UserContext", () => ({
  useUser: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

const mockedUseUser = useUser as unknown as jest.MockedFunction<typeof useUser>;
const mockedUseNavigate = useNavigate as unknown as jest.Mock<
  ReturnType<typeof useNavigate>,
  Parameters<typeof useNavigate>
>;

describe("Home header", () => {
  let navigateSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    navigateSpy = jest.fn();

    mockedUseUser.mockReturnValue({
      username: "guest",
    } as unknown as ReturnType<typeof useUser>);
    mockedUseNavigate.mockReturnValue(navigateSpy);
  });

  test("toggles navigation menu visibility", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const toggle = screen.getByRole("button", { name: /toggle navigation/i });
    const nav = screen.getByRole("navigation");

    expect(nav.className).not.toMatch(/open/);

    await user.click(toggle);
    expect(nav.className).toMatch(/open/);

    await user.click(toggle);
    expect(nav.className).not.toMatch(/open/);
  });

  test("navigates when comic buttons are pressed", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: /my matches/i }));

    expect(navigateSpy).toHaveBeenCalledWith("/mymatches");
  });
});
