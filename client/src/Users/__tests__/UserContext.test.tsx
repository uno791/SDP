import { renderHook, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UserProvider, useUser } from "../UserContext";
import { User } from "../User";

describe("UserContext", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <UserProvider>{children}</UserProvider>
  );

  test("hydrates user from localStorage on mount", async () => {
    const stored = { id: "123", username: "storage-user" };
    window.localStorage.setItem("user", JSON.stringify(stored));

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => expect(result.current.username).toBe("storage-user"));
    expect(result.current.user).toBeInstanceOf(User);
    expect(result.current.user?.username).toBe("storage-user");
  });

  test("setUser persists data and updates username", async () => {
    const { result } = renderHook(() => useUser(), { wrapper });

    const newUser = new User({ id: "42", username: "newbie" });

    await act(async () => {
      result.current.setUser(newUser);
    });

    expect(JSON.parse(window.localStorage.getItem("user") || "{}")).toMatchObject({
      id: "42",
      username: "newbie",
    });
    expect(result.current.username).toBe("newbie");

    await act(async () => {
      result.current.setUser(null);
    });

    expect(window.localStorage.getItem("user")).toBeNull();
    expect(result.current.username).toBe("");
  });

  test("respects initialUser without hitting storage", () => {
    const initialUser = new User({ id: "seed", username: "seed-user" });

    const { result } = renderHook(() => useUser(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <UserProvider initialUser={initialUser}>{children}</UserProvider>
      ),
    });

    expect(result.current.user?.id).toBe("seed");
    expect(result.current.username).toBe("seed-user");
    expect(window.localStorage.getItem("user")).toBeNull();
  });

  test("throws an error when useUser is called outside provider", () => {
    expect(() => renderHook(() => useUser())).toThrow(
      "useUser must be used within a UserProvider"
    );
  });
});
