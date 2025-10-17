import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { NavBar } from "../NavBar";
import Header from "../LandingPageComp/Layout/Header";
import BurgerMenu from "../LandingPageComp/Layout/BurgerMenu";
import { UserProvider } from "../../Users/UserContext";
import { User } from "../../Users/User";

describe("navigation components", () => {
  test("NavBar renders all destination buttons", () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );

    const buttons = [
      { name: "Home", path: "/" },
      { name: "House", path: "/house" },
      { name: "Ball", path: "/ball" },
      { name: "Doodle Home", path: "/doodlehome" },
      { name: "Sign up", path: "/signup" },
      { name: "Log in", path: "/login" },
    ];

    for (const { name, path } of buttons) {
      const button = screen.getByRole("button", { name });
      const link = button.closest("a");
      expect(link).toHaveAttribute("href", path);
    }
  });

  test("Header triggers open menu callback", async () => {
    const open = jest.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <UserProvider storage={null}>
          <Header onOpenMenu={open} />
        </UserProvider>
      </MemoryRouter>
    );

    const menuButton = screen.getByRole("button", { name: /open menu/i });
    await user.click(menuButton);

    expect(open).toHaveBeenCalledTimes(1);
  });

  test("BurgerMenu lists all sections and calls onClose", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    render(
      <UserProvider storage={null}>
        <BurgerMenu open onClose={onClose} />
      </UserProvider>
    );

    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "/",
      "/favourite",
      "/watchalongs",
      "/user-games",
      "/mymatches",
      "/signup",
    ]);

    await user.click(links[0]!);
    expect(onClose).toHaveBeenCalled();
  });

  test("Header shows signup button when user is logged out", () => {
    render(
      <MemoryRouter>
        <UserProvider storage={null}>
          <Header onOpenMenu={() => undefined} />
        </UserProvider>
      </MemoryRouter>
    );

    const signupLink = screen.getByRole("link", {
      name: /sign up to follow your teams/i,
    });
    expect(signupLink).toHaveAttribute("href", "/signup");

    const homeLink = screen.getByRole("link", { name: /footbook/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  test("Header hides signup button when user is logged in", () => {
    const initialUser = new User({ id: "abc-123", username: "Casey" });

    render(
      <MemoryRouter>
        <UserProvider initialUser={initialUser} storage={null}>
          <Header onOpenMenu={() => undefined} />
        </UserProvider>
      </MemoryRouter>
    );

    expect(
      screen.queryByRole("link", {
        name: /sign up to follow your teams/i,
      })
    ).not.toBeInTheDocument();

    const homeLink = screen.getByRole("link", { name: /casey/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  test("BurgerMenu shows sign out button when user is logged in", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    const initialUser = new User({ id: "test-user", username: "Jane" });

    render(
      <UserProvider initialUser={initialUser} storage={null}>
        <BurgerMenu open onClose={onClose} />
      </UserProvider>
    );

    const signOut = screen.getByRole("button", { name: /sign out/i });
    expect(signOut).toBeInTheDocument();

    // With a logged-in user the SignUp link should be hidden
    expect(
      screen.getAllByRole("link").map((link) => link.getAttribute("href"))
    ).not.toContain("/signup");

    await user.click(signOut);
    expect(onClose).toHaveBeenCalled();
  });
});
