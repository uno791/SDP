import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Layout } from "../Layout";

jest.mock("../components/LandingPageComp/Layout/Header", () => ({
  onOpenMenu,
}: {
  onOpenMenu: () => void;
}) => (
  <button type="button" onClick={onOpenMenu} aria-label="open menu">
    open
  </button>
));

jest.mock("../components/LandingPageComp/Layout/BurgerMenu", () => ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => (
  <div>
    <span data-testid="burger-state">{open ? "open" : "closed"}</span>
    <button type="button" onClick={onClose} aria-label="close menu">
      close
    </button>
  </div>
));

describe("Layout", () => {
  test("toggles burger menu when header callbacks fire", async () => {
    const user = userEvent.setup();

    render(<Layout />);

    expect(screen.getByTestId("burger-state")).toHaveTextContent("closed");

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    expect(screen.getByTestId("burger-state")).toHaveTextContent("open");

    await user.click(screen.getByRole("button", { name: /close menu/i }));
    expect(screen.getByTestId("burger-state")).toHaveTextContent("closed");
  });
});
