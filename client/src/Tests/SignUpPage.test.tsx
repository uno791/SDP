// __tests__/SignUpPage.test.tsx
import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// SUT
import SignUpPage from "../pages/SignUpPage";

// ── Mocks for child components ───────────────────────────────────────────────
// We mock GoogleSignUpButton to render a predictable button and expose a spy.
const mockGoogleLoginClick = jest.fn();

jest.mock(
  "../components/HomePageComp/SignUpPageComp/GoogleSignUpButton",
  () => ({
    GoogleSignUpButton: () => <button>Sign Up with Google</button>,
  })
);

// We mock LoginPrompt to render a link/button that navigates to /login
jest.mock("../components/HomePageComp/SignUpPageComp/LoginPrompt", () => ({
  __esModule: true,
  LoginPrompt: () => (
    <a href="/login" role="button">
      Log In!
    </a>
  ),
}));

// Optional: silence noisy console errors from React during tests
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

describe("SignUpPage", () => {
  test("renders Sign Up and Log In actions", () => {
    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("button", { name: /sign up with google/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /log in!/i })
    ).toBeInTheDocument();
  });

  test('clicking "Sign Up with Google" triggers Google login', () => {
    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );

    const signUpBtn = screen.getByRole("button", {
      name: /sign up with google/i,
    });
    fireEvent.click(signUpBtn);

    expect(mockGoogleLoginClick).toHaveBeenCalled();
  });

  test('clicking "Log In!" navigates to the login route', () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<SignUpPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    const loginBtn = screen.getByRole("button", { name: /log in!/i });
    fireEvent.click(loginBtn);

    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });
});
