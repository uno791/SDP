import { renderHook, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { ProfileProvider, useProfile } from "../ProfileContext";
import { useUser } from "../UserContext";

jest.mock("axios");
jest.mock("../UserContext", () => ({
  useUser: jest.fn(),
}));

type UseUserReturn = ReturnType<typeof useUser>;

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedUseUser = useUser as jest.MockedFunction<typeof useUser>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ProfileProvider>{children}</ProfileProvider>
);

describe("ProfileContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("fetches and caches the profile for the signed-in user", async () => {
    mockedUseUser.mockReturnValue({
      user: { username: "alice" },
    } as unknown as UseUserReturn);

    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          postal_code: 98765,
          phone_no: "555-0101",
          user_pfp: "avatar.png",
        },
      })
      .mockResolvedValueOnce({ data: { verified: 1 } });

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() =>
      expect(result.current.profile).toMatchObject({
        phone: "555-0101",
      })
    );

    expect(result.current.profile).toEqual({
      postalCode: "98765",
      phone: "555-0101",
      image: "avatar.png",
      sellerStatus: "approved",
    });

    const cached = JSON.parse(
      window.localStorage.getItem("profileData:alice") || "{}"
    );
    expect(cached.data).toMatchObject({ phone: "555-0101" });
  });

  test("does nothing when there is no authenticated user", async () => {
    mockedUseUser.mockReturnValue({ user: null } as unknown as UseUserReturn);

    renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(mockedAxios.get).not.toHaveBeenCalled());
  });

  test("logs an error when profile fetch fails", async () => {
    mockedUseUser.mockReturnValue({
      user: { username: "bob" },
    } as unknown as UseUserReturn);

    const error = new Error("network");
    mockedAxios.get.mockRejectedValue(error);
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(consoleSpy).toHaveBeenCalled());

    expect(result.current.profile).toEqual({
      postalCode: "-",
      phone: "",
      image: null,
      sellerStatus: "none",
    });

    consoleSpy.mockRestore();
  });
});
