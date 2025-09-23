import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { NavBar } from "../NavBar";
import Header from "../LandingPageComp/Layout/Header";
import BurgerMenu from "../LandingPageComp/Layout/BurgerMenu";

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

    render(<Header onOpenMenu={open} />);

    const menuButton = screen.getByRole("button", { name: /open menu/i });
    await user.click(menuButton);

    expect(open).toHaveBeenCalledTimes(1);
  });

  test("BurgerMenu lists all sections and calls onClose", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    render(<BurgerMenu open onClose={onClose} />);

    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "/home",
      "/",
      "/favourite",
      "/user-games",
      "/profile",
      "/mymatches",
      "/watchalongs",
    ]);

    await user.click(links[0]!);
    expect(onClose).toHaveBeenCalled();
  });
});
