import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";

import AuthScreen from "../components/LoginSignupComp/Auth/AuthScreen";
import GoogleLogInButton from "../components/LoginSignupComp/GoogleButtons/GoogleLogInButton";
import GoogleSignUpButton from "../components/LoginSignupComp/GoogleButtons/GoogleSignupButton";
import { useUser } from "../Users/UserContext";
import { User } from "../Users/User";

jest.mock("@react-oauth/google", () => ({
  useGoogleLogin: jest.fn(),
}));

jest.mock("axios");

jest.mock("../Users/UserContext", () => ({
  useUser: jest.fn(),
}));

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});

const mockSetUser = jest.fn();
const mockNavigate = jest.fn();

beforeEach(() => {
  (useUser as jest.Mock).mockReturnValue({ setUser: mockSetUser });
  (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore();
});

describe("AuthScreen", () => {
  const renderAuth = (mode: "login" | "signup") =>
    render(
      <MemoryRouter>
        <AuthScreen mode={mode} />
      </MemoryRouter>
    );

  it("renders signup view with landing-inspired copy", () => {
    renderAuth("signup");

    expect(
      screen.getByRole("heading", { name: /Begin your Footbook journey/i })
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: /Sign up with Google/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Google sign up is the exclusive way in/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Log in/i })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  it("renders login view and links to signup", () => {
    renderAuth("login");

    expect(
      screen.getByRole("heading", { name: /Sign in to matchday central/i })
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: /Log in with Google/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Use your Google account to jump straight into the action/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Create an account/i })
    ).toHaveAttribute("href", "/signup");
  });
});

describe("GoogleLogInButton", () => {
  it("calls login function on click", () => {
    const loginMock = jest.fn();
    const { useGoogleLogin } = require("@react-oauth/google");
    (useGoogleLogin as jest.Mock).mockReturnValue(loginMock);

    render(
      <MemoryRouter>
        <GoogleLogInButton />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /Log in with Google/i }));
    expect(loginMock).toHaveBeenCalled();
  });

  it("shows error if login fails", async () => {
    const { useGoogleLogin } = require("@react-oauth/google");
    (useGoogleLogin as jest.Mock).mockImplementation(
      ({ onError }) =>
        () =>
          onError(new Error("fail"))
    );

    render(
      <MemoryRouter>
        <GoogleLogInButton />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /Log in with Google/i }));

    await waitFor(() =>
      expect(screen.getByText(/Google login failed/)).toBeInTheDocument()
    );
  });

  it("sets user and navigates on success", async () => {
    (axios.get as jest.Mock)
      .mockResolvedValueOnce({ data: { sub: "123", name: "John" } })
      .mockResolvedValueOnce({ data: { exists: true, username: "johnny" } });

    const { useGoogleLogin } = require("@react-oauth/google");
    (useGoogleLogin as jest.Mock).mockImplementation(
      ({ onSuccess }) =>
        () =>
          onSuccess({ access_token: "token" })
    );

    render(
      <MemoryRouter>
        <GoogleLogInButton />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /Log in with Google/i }));

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith(expect.any(User));
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});

describe("GoogleSignUpButton", () => {
  it("calls login function on click", () => {
    const loginMock = jest.fn();
    const { useGoogleLogin } = require("@react-oauth/google");
    (useGoogleLogin as jest.Mock).mockReturnValue(loginMock);

    render(
      <MemoryRouter>
        <GoogleSignUpButton />
      </MemoryRouter>
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Sign up with Google/i })
    );
    expect(loginMock).toHaveBeenCalled();
  });

  it("shows error if signup fails", async () => {
    const { useGoogleLogin } = require("@react-oauth/google");
    (useGoogleLogin as jest.Mock).mockImplementation(
      ({ onError }) =>
        () =>
          onError(new Error("fail"))
    );

    render(
      <MemoryRouter>
        <GoogleSignUpButton />
      </MemoryRouter>
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Sign up with Google/i })
    );

    await waitFor(() =>
      expect(screen.getByText(/Google login failed/)).toBeInTheDocument()
    );
  });

  it("shows error if user already exists", async () => {
    (axios.get as jest.Mock)
      .mockResolvedValueOnce({ data: { sub: "123", name: "John" } })
      .mockResolvedValueOnce({ data: { exists: true } });

    const { useGoogleLogin } = require("@react-oauth/google");
    (useGoogleLogin as jest.Mock).mockImplementation(
      ({ onSuccess }) =>
        () =>
          onSuccess({ access_token: "token" })
    );

    render(
      <MemoryRouter>
        <GoogleSignUpButton />
      </MemoryRouter>
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Sign up with Google/i })
    );

    await waitFor(() =>
      expect(screen.getByText(/User already exists/)).toBeInTheDocument()
    );
  });

  it("creates user and navigates on success", async () => {
    (axios.get as jest.Mock)
      .mockResolvedValueOnce({ data: { sub: "123", name: "John" } })
      .mockResolvedValueOnce({ data: { exists: false } });
    (axios.post as jest.Mock).mockResolvedValueOnce({});

    const { useGoogleLogin } = require("@react-oauth/google");
    (useGoogleLogin as jest.Mock).mockImplementation(
      ({ onSuccess }) =>
        () =>
          onSuccess({ access_token: "token" })
    );

    render(
      <MemoryRouter>
        <GoogleSignUpButton />
      </MemoryRouter>
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Sign up with Google/i })
    );

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith(expect.any(User));
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});
