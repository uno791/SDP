import React from "react";
import { render, screen } from "@testing-library/react";
import AuthPanel from "../AuthPanel";
import styles from "../AuthPanel.module.css";

jest.mock("../../GoogleButtons/GoogleSignupButton", () => () => (
  <div data-testid="google-signup" />
));

jest.mock("../../GoogleButtons/GoogleLogInButton", () => () => (
  <div data-testid="google-login" />
));

describe("AuthPanel", () => {
  it("renders sign up variant with correct illustration and copy", () => {
    render(<AuthPanel type="signup" image="/signup.png" side="left" />);

    expect(
      screen.getByRole("heading", { name: "SIGN UP" })
    ).toBeInTheDocument();

    const illustration = screen.getByRole("img", { name: "signup" });
    expect(illustration).toHaveAttribute("src", "/signup.png");
    expect(illustration).toHaveClass(styles.illustrationleft);

    expect(screen.getByTestId("google-signup")).toBeInTheDocument();
    expect(screen.queryByTestId("google-login")).not.toBeInTheDocument();

    expect(
      screen.getByText("Already have an account?", { exact: false })
    ).toHaveTextContent("Already have an account? Login →");
  });

  it("renders login variant with correct illustration and copy", () => {
    render(<AuthPanel type="login" image="/login.png" side="right" />);

    expect(
      screen.getByRole("heading", { name: "LOGIN" })
    ).toBeInTheDocument();

    const illustration = screen.getByRole("img", { name: "login" });
    expect(illustration).toHaveAttribute("src", "/login.png");
    expect(illustration).toHaveClass(styles.illustrationright);

    expect(screen.getByTestId("google-login")).toBeInTheDocument();
    expect(screen.queryByTestId("google-signup")).not.toBeInTheDocument();

    expect(
      screen.getByText("Don’t have an account?", { exact: false })
    ).toHaveTextContent("Don’t have an account? ←Create your account!");
  });
});
