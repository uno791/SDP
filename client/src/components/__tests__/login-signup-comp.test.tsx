import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ComicSticker from "../LoginSignupComp/ComicStickers/ComicStickers";
import ComicPanel from "../LoginSignupComp/ComicPanel/ComicPanel";
import ComicBook from "../LoginSignupComp/ComicBook/ComicBook";
import AuthPanel from "../LoginSignupComp/Auth/AuthPanel";
import GoogleSignUpButton from "../LoginSignupComp/GoogleButtons/GoogleSignupButton";
import GoogleLogInButton from "../LoginSignupComp/GoogleButtons/GoogleLogInButton";

jest.mock("@react-oauth/google", () => ({
  useGoogleLogin: jest.fn(),
}));

jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

const navigateSpy = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => navigateSpy,
}));

const mockSetUser = jest.fn();
const mockSetUsername = jest.fn();

jest.mock("../../Users/UserContext", () => ({
  useUser: () => ({
    user: null,
    setUser: mockSetUser,
    username: "",
    setUsername: mockSetUsername,
  }),
}));

jest.mock("../../config", () => ({
  baseURL: "http://localhost:3000",
  API_BASE: "http://localhost:3000",
}));

describe("Login & signup components", () => {
  const mockUseGoogleLogin = require("@react-oauth/google").useGoogleLogin as jest.Mock;
  const axios = require("axios");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Comic helpers render correctly", () => {
    const { rerender } = render(
      <ComicSticker text="Pow" color="#fff" rotation={10} />
    );
    expect(screen.getByText("Pow")).toBeInTheDocument();

    rerender(
      <ComicPanel color="#abc">
        <span>Inside</span>
      </ComicPanel>
    );
    expect(screen.getByText("Inside")).toBeInTheDocument();
  });

  test("ComicBook stitches panels together", () => {
    render(<ComicBook />);
    expect(screen.getAllByText(/SIGN UP|LOGIN/).length).toBeGreaterThan(0);
  });

  test("AuthPanel switches based on type", () => {
    const { rerender } = render(
      <AuthPanel type="signup" image="img.png" side="left" />
    );
    expect(screen.getByText("SIGN UP")).toBeInTheDocument();
    expect(screen.getByText(/Already have an account/)).toBeInTheDocument();

    rerender(<AuthPanel type="login" image="img.png" side="right" />);
    expect(screen.getByText("LOGIN")).toBeInTheDocument();
    expect(screen.getByText(/Don’t have an account/)).toBeInTheDocument();
  });

  test("GoogleSignUpButton creates new users", async () => {
    const user = userEvent.setup();
    const googleUser = {
      data: {
        sub: "sub-1",
        name: "Alex",
        email: "alex@example.com",
        given_name: "Alex",
        family_name: "Nine",
        picture: "pic.png",
      },
    };

    (axios.get as jest.Mock)
      .mockResolvedValueOnce(googleUser)
      .mockResolvedValueOnce({ data: { exists: false } });
    (axios.post as jest.Mock).mockResolvedValue({});

    mockUseGoogleLogin.mockImplementation(({ onSuccess }: any) => async () => {
      await onSuccess?.({ access_token: "token" });
    });

    render(<GoogleSignUpButton />);

    await user.click(screen.getByRole("button", { name: /SIGN UP WITH GOOGLE/i }));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(mockSetUser).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith("/");
  });

  test("GoogleLogInButton handles missing accounts", async () => {
    const user = userEvent.setup();
    const googleUser = {
      data: {
        sub: "sub-2",
        name: "Sam",
        email: "sam@example.com",
        given_name: "Sam",
        family_name: "Smith",
        picture: "pic.png",
      },
    };

    (axios.get as jest.Mock)
      .mockResolvedValueOnce(googleUser)
      .mockResolvedValueOnce({ data: { exists: false } });

    mockUseGoogleLogin.mockImplementation(({ onSuccess }: any) => async () => {
      await onSuccess?.({ access_token: "token" });
    });

    render(<GoogleLogInButton />);

    await user.click(screen.getByRole("button", { name: /LOGIN WITH GOOGLE/i }));
    await waitFor(() => screen.getByText(/No account found/));
    expect(mockSetUser).not.toHaveBeenCalled();
  });

  test("GoogleLogInButton logs in existing users", async () => {
    const user = userEvent.setup();
    const googleUser = {
      data: {
        sub: "sub-3",
        name: "Taylor",
        email: "taylor@example.com",
        given_name: "Taylor",
        family_name: "Swift",
        picture: "pic.png",
      },
    };

    (axios.get as jest.Mock)
      .mockResolvedValueOnce(googleUser)
      .mockResolvedValueOnce({ data: { exists: true, username: "Taylor" } });

    mockUseGoogleLogin.mockImplementation(({ onSuccess }: any) => async () => {
      await onSuccess?.({ access_token: "token" });
    });

    render(<GoogleLogInButton />);

    await user.click(screen.getByRole("button", { name: /LOGIN WITH GOOGLE/i }));
    await waitFor(() => expect(mockSetUser).toHaveBeenCalled());
    expect(navigateSpy).toHaveBeenCalledWith("/");
  });
});
