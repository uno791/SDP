import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AuthPanel from "../components/LoginSignupComp/Auth/AuthPanel";
import GoogleLogInButton from "../components/LoginSignupComp/GoogleButtons/GoogleLogInButton";
import GoogleSignUpButton from "../components/LoginSignupComp/GoogleButtons/GoogleSignupButton";
import { useUser } from "../Users/UserContext";
import { User } from "../Users/User";
import { MemoryRouter, useNavigate } from "react-router-dom";
import axios from "axios";

// Mock hooks and dependencies
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
});

describe("AuthPanel", () => {
  it("renders signup panel correctly", () => {
    render(<AuthPanel type="signup" image="signup.png" side="left" />);
    expect(screen.getByText("SIGN UP")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "signup" })).toHaveAttribute(
      "src",
      "signup.png"
    );
    expect(screen.getByText("SIGN UP WITH GOOGLE")).toBeInTheDocument();
    expect(screen.getByText(/Already have an account/)).toBeInTheDocument();
  });

  it("renders login panel correctly", () => {
    render(<AuthPanel type="login" image="login.png" side="right" />);
    expect(screen.getByText("LOGIN")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "login" })).toHaveAttribute(
      "src",
      "login.png"
    );
    expect(screen.getByText("LOGIN WITH GOOGLE")).toBeInTheDocument();
    expect(screen.getByText(/Don’t have an account/)).toBeInTheDocument();
  });
});

describe("GoogleLogInButton", () => {
  it("calls login function on click", () => {
    const loginMock = jest.fn();
    const { useGoogleLogin } = require("@react-oauth/google");
    (useGoogleLogin as jest.Mock).mockReturnValue(loginMock);

    render(<GoogleLogInButton />);
    fireEvent.click(screen.getByText("LOGIN WITH GOOGLE"));
    expect(loginMock).toHaveBeenCalled();
  });

  it("shows error if login fails", async () => {
    const { useGoogleLogin } = require("@react-oauth/google");
    (useGoogleLogin as jest.Mock).mockImplementation(
      ({ onError }) =>
        () =>
          onError(new Error("fail"))
    );

    render(<GoogleLogInButton />);
    fireEvent.click(screen.getByText("LOGIN WITH GOOGLE"));

    await waitFor(() =>
      expect(screen.getByText(/Google login failed/)).toBeInTheDocument()
    );
  });

  it("sets user and navigates on success", async () => {
    (axios.get as jest.Mock)
      .mockResolvedValueOnce({ data: { sub: "123", name: "John" } }) // Google user info
      .mockResolvedValueOnce({ data: { exists: true, username: "johnny" } }); // DB check

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
    fireEvent.click(screen.getByText("LOGIN WITH GOOGLE"));

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

    render(<GoogleSignUpButton />);
    fireEvent.click(screen.getByText("SIGN UP WITH GOOGLE"));
    expect(loginMock).toHaveBeenCalled();
  });

  it("shows error if signup fails", async () => {
    const { useGoogleLogin } = require("@react-oauth/google");
    (useGoogleLogin as jest.Mock).mockImplementation(
      ({ onError }) =>
        () =>
          onError(new Error("fail"))
    );

    render(<GoogleSignUpButton />);
    fireEvent.click(screen.getByText("SIGN UP WITH GOOGLE"));

    await waitFor(() =>
      expect(screen.getByText(/Google login failed/)).toBeInTheDocument()
    );
  });

  it("shows error if user already exists", async () => {
    (axios.get as jest.Mock)
      .mockResolvedValueOnce({ data: { sub: "123", name: "John" } }) // Google info
      .mockResolvedValueOnce({ data: { exists: true } }); // DB says exists

    const { useGoogleLogin } = require("@react-oauth/google");
    (useGoogleLogin as jest.Mock).mockImplementation(
      ({ onSuccess }) =>
        () =>
          onSuccess({ access_token: "token" })
    );

    render(<GoogleSignUpButton />);
    fireEvent.click(screen.getByText("SIGN UP WITH GOOGLE"));

    await waitFor(() =>
      expect(screen.getByText(/User already exists/)).toBeInTheDocument()
    );
  });

  it("creates user and navigates on success", async () => {
    (axios.get as jest.Mock)
      .mockResolvedValueOnce({ data: { sub: "123", name: "John" } }) // Google info
      .mockResolvedValueOnce({ data: { exists: false } }); // DB says new
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
    fireEvent.click(screen.getByText("SIGN UP WITH GOOGLE"));

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith(expect.any(User));
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});
