import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

import AuthScreen from "../components/LoginSignupComp/Auth/AuthScreen";
import { UserProvider } from "../Users/UserContext";

const mockUseGoogleLogin = jest.fn((..._args: any[]) => jest.fn());

jest.mock("@react-oauth/google", () => ({
  useGoogleLogin: (...args: any[]) => mockUseGoogleLogin(...args),
}));

const createStorageMock = () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
});

describe("AuthScreen", () => {
  beforeEach(() => {
    mockUseGoogleLogin.mockClear();
  });

  const renderAuth = (mode: "login" | "signup") =>
    render(
      <MemoryRouter>
        <UserProvider storage={createStorageMock()}>
          <AuthScreen mode={mode} />
        </UserProvider>
      </MemoryRouter>
    );

  test("renders signup experience with headline copy and Google CTA", () => {
    renderAuth("signup");

    expect(
      screen.getByRole("heading", { name: /Begin your Footbook journey/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sign up with Google/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Unlock live dashboards/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Log in/i })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  test("renders login mode with returning-user messaging", () => {
    renderAuth("login");

    expect(
      screen.getByRole("heading", { name: /Sign in to matchday central/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Live matches tracked/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Log in with Google/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Create an account/i })
    ).toHaveAttribute("href", "/signup");
  });
});
