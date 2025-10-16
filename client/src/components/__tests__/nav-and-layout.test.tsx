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
      <UserProvider storage={null}>
        <Header onOpenMenu={open} />
      </UserProvider>
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
