import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../App";

jest.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("../Layout", () => {
  const React = require("react");
  const { Outlet } = require("react-router-dom");
  return {
    Layout: () => (
      <div data-testid="layout-wrapper">
        <Outlet />
      </div>
    ),
  };
});

jest.mock("../pages/home", () => () => <div>Home Page</div>);
jest.mock("../pages/house", () => ({ House: () => <div>House Page</div> }));
jest.mock("../pages/ball", () => ({ Ball: () => <div>Ball Page</div> }));
jest.mock("../pages/liveeplscoreboard", () => () => <div>Live EPL</div>);
jest.mock("../pages/LandingPage", () => () => <div>Landing Page</div>);
jest.mock("../pages/ProfilePage", () => () => <div>Profile Page</div>);
jest.mock("../pages/MatchViewer", () => () => <div>Match Viewer</div>);
jest.mock("../pages/PlayerStats", () => () => <div>Player Stats</div>);
jest.mock("../pages/Commentary", () => () => <div>Commentary Page</div>);
jest.mock("../pages/Watchalongs", () => () => <div>Watchalongs Page</div>);
jest.mock("../pages/MatchPages/MyMatches", () => () => <div>My Matches</div>);
jest.mock("../pages/MatchPages/CreateMatch", () => () => <div>Create Match</div>);
jest.mock("../pages/MatchPages/LiveMatchUpdate", () => () => <div>Live Update</div>);
jest.mock("../pages/LoginPage", () => () => <div>Login Screen</div>);
jest.mock("../pages/SignupPage", () => () => <div>Signup Screen</div>);

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe("App routing", () => {
  test("renders landing page at root path", () => {
    window.history.pushState({}, "Landing", "/");

    render(<App />);

    expect(screen.getByText("Landing Page")).toBeInTheDocument();
  });

  test("renders layout-wrapped routes like /home", () => {
    window.history.pushState({}, "Home", "/home");

    render(<App />);

    expect(screen.getByTestId("layout-wrapper")).toBeInTheDocument();
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  test("renders commentary route outside of layout", () => {
    window.history.pushState({}, "Commentary", "/commentary");

    render(<App />);

    expect(screen.queryByTestId("layout-wrapper")).not.toBeInTheDocument();
    expect(screen.getByText("Commentary Page")).toBeInTheDocument();
  });
});
