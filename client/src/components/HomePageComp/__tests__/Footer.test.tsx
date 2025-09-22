import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Footer from "../Footer/Footer";
import { useUser } from "../../../Users/UserContext";

jest.mock("../../../Users/UserContext", () => ({
  useUser: jest.fn(),
}));

const mockedUseUser = useUser as jest.MockedFunction<typeof useUser>;

describe("Home footer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows signup and login prompts when no user is present", () => {
    mockedUseUser.mockReturnValue({
      username: "",
    } as unknown as ReturnType<typeof useUser>);

    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("button", { name: /sign up free/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /log in/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Never miss a moment/i)).toBeInTheDocument();
  });

  test("hides auth buttons when user already signed in", () => {
    mockedUseUser.mockReturnValue({
      username: "captain",
    } as unknown as ReturnType<typeof useUser>);

    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(
      screen.queryByRole("button", { name: /sign up free/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /log in/i })).not.toBeInTheDocument();
  });
});
