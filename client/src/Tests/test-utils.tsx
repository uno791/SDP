import { ReactNode, ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { UserProvider } from "../Users/UserContext";
import { User } from "../Users/User";

interface MockUser {
  id?: string;
  username?: string;
}

interface RenderWithUserOptions extends RenderOptions {
  user?: MockUser | null;
}

export function createUserWrapper(user?: MockUser | null) {
  const initialUser = user
    ? new User({ id: user.id ?? "test-user", username: user.username })
    : null;

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <UserProvider initialUser={initialUser}>
        {children}
      </UserProvider>
    );
  };
}

export function renderWithUser(
  ui: ReactElement,
  { user, ...renderOptions }: RenderWithUserOptions = {}
) {
  const resolvedUser =
    user === undefined ? { id: "test-user", username: "Test User" } : user;
  const wrapper = createUserWrapper(resolvedUser);
  return render(ui, { wrapper, ...renderOptions });
}
