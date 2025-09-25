import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

import GoogleLogInButton from "../LoginSignupComp/GoogleButtons/GoogleLogInButton";
import GoogleSignUpButton from "../LoginSignupComp/GoogleButtons/GoogleSignupButton";

const mockUseGoogleLogin = jest.fn();
const mockSetUser = jest.fn();
const mockNavigate = jest.fn();

jest.mock("@react-oauth/google", () => ({
  useGoogleLogin: (config: any) => mockUseGoogleLogin(config),
}));

jest.mock("../../Users/UserContext", () => ({
  useUser: () => ({
    setUser: mockSetUser,
  }),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe("Google auth buttons", () => {
  beforeEach(() => {
    mockUseGoogleLogin.mockReset();
    mockSetUser.mockReset();
    mockNavigate.mockReset();
  });

  test("GoogleLogInButton triggers the Google login flow on click", () => {
    const loginFn = jest.fn();
    mockUseGoogleLogin.mockReturnValue(loginFn);

    render(
      <MemoryRouter>
        <GoogleLogInButton />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Log in with Google/i }));
    expect(loginFn).toHaveBeenCalled();
  });

  test("GoogleLogInButton surfaces SDK errors to the user", async () => {
    mockUseGoogleLogin.mockReturnValue(jest.fn());

    render(
      <MemoryRouter>
        <GoogleLogInButton />
      </MemoryRouter>
    );

    const config = mockUseGoogleLogin.mock.calls[0]?.[0];
    expect(config).toBeDefined();

    await act(async () => {
      config?.onError?.(new Error("fail"));
    });

    expect(
      screen.getByText(/Google login failed\. Please try again\./i)
    ).toBeInTheDocument();
  });

  test("GoogleSignUpButton renders custom copy when provided", () => {
    mockUseGoogleLogin.mockReturnValue(jest.fn());

    render(
      <MemoryRouter>
        <GoogleSignUpButton buttonText="Join Footbook" />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("button", { name: /Join Footbook/i })
    ).toBeInTheDocument();
  });

  test("GoogleSignUpButton shows a Google error message", async () => {
    mockUseGoogleLogin.mockReturnValue(jest.fn());

    render(
      <MemoryRouter>
        <GoogleSignUpButton />
      </MemoryRouter>
    );

    const config = mockUseGoogleLogin.mock.calls[0]?.[0];
    expect(config).toBeDefined();

    await act(async () => {
      config?.onError?.(new Error("boom"));
    });

    expect(
      screen.getByText(/Google login failed\. Please try again\./i)
    ).toBeInTheDocument();
  });
});
