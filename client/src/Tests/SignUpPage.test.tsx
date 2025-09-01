// src/Tests/SignUpPage.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Link } from "react-router-dom";

// ---- 1) A real, callable mock for the Google button ----
const mockGoogleLoginClick = jest.fn();

// IMPORTANT: match the actual export shape of your module.
// If your real component is a *named* export (export const GoogleSignUpButton = ...)
// keep the named export below. If it's a default export, switch to "default:".
jest.mock(
  "@/components/HomePageComp/SignUpPageComp/GoogleSignUpButton",
  () => ({
    __esModule: true,
    GoogleSignUpButton: () => (
      <button onClick={() => mockGoogleLoginClick()}>
        Sign Up with Google
      </button>
    ),
    // If it's default instead:
    // default: () => <button onClick={() => mockGoogleLoginClick()}>Sign Up with Google</button>,
  })
);

jest.mock("@/components/HomePageComp/SignUpPageComp/LoginPrompt", () => ({
  __esModule: true,
  // If LoginPrompt is a named export:
  LoginPrompt: () => (
    <Link to="/login" role="button">
      Log In!
    </Link>
  ),
  // If it’s a default export in your real file, use:
  // default: () => (
  //   <Link to="/login" role="button">Log In!</Link>
  // ),
}));

// ---- 2) Import the page under test AFTER mocks ----
import SignUpPage from "../pages/SignUpPage"; // adjust path if different

describe("SignUpPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderWithRouter() {
    // We mount a router with two routes:
    //  - /signup: the page under test
    //  - /login: a placeholder component so navigation renders visible text
    return render(
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  test("renders Sign Up and Log In actions", () => {
    renderWithRouter();
    // Buttons/links from our mocks should be present
    expect(
      screen.getByRole("button", { name: /sign up with google/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /log in!/i })
    ).toBeInTheDocument();
  });

  test('clicking "Sign Up with Google" triggers Google login', () => {
    renderWithRouter();

    const signUpBtn = screen.getByRole("button", {
      name: /sign up with google/i,
    });
    fireEvent.click(signUpBtn);

    // Our mock button calls mockGoogleLoginClick() on click
    expect(mockGoogleLoginClick).toHaveBeenCalled();
  });

  test('clicking "Log In!" navigates to the login route', () => {
    renderWithRouter();

    const loginBtn = screen.getByRole("button", { name: /log in!/i });
    fireEvent.click(loginBtn);

    // Because MemoryRouter handles navigation and we defined a /login route,
    // clicking the link causes the "Login Page" placeholder to render
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });
});
