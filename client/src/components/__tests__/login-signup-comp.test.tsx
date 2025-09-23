// import { render, screen, fireEvent, waitFor } from "@testing-library/react";
// import userEvent from "@testing-library/user-event";
// import { MemoryRouter } from "react-router-dom";

// import AuthScreen from "../LoginSignupComp/Auth/AuthScreen";
// import GoogleLogInButton from "../LoginSignupComp/GoogleButtons/GoogleLogInButton";
// import GoogleSignUpButton from "../LoginSignupComp/GoogleButtons/GoogleSignupButton";

// jest.mock("@react-oauth/google", () => ({
//   useGoogleLogin: jest.fn(),
// }));

// jest.mock("axios", () => ({
//   get: jest.fn(),
//   post: jest.fn(),
// }));

// const navigateSpy = jest.fn();

// jest.mock("react-router-dom", () => ({
//   ...jest.requireActual("react-router-dom"),
//   useNavigate: () => navigateSpy,
// }));

// const mockSetUser = jest.fn();
// const mockSetUsername = jest.fn();

// jest.mock("../../Users/UserContext", () => ({
//   useUser: () => ({
//     user: null,
//     setUser: mockSetUser,
//     username: "",
//     setUsername: mockSetUsername,
//   }),
// }));

// jest.mock("../../config", () => ({
//   baseURL: "http://localhost:3000",
//   API_BASE: "http://localhost:3000",
// }));

// describe("auth experience", () => {
//   const mockUseGoogleLogin = require("@react-oauth/google").useGoogleLogin as jest.Mock;
//   const axios = require("axios");

//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   test("signup screen emphasises Google-only entry", () => {
//     render(
//       <MemoryRouter>
//         <AuthScreen mode="signup" />
//       </MemoryRouter>
//     );

//     expect(screen.queryAllByRole("textbox")).toHaveLength(0);
//     expect(
//       screen.getByRole("button", { name: /Sign up with Google/i })
//     ).toBeInTheDocument();
//     expect(
//       screen.getByText(/Google sign up is the exclusive way in/i)
//     ).toBeInTheDocument();
//   });

//   test("login screen showcases live match highlight copy", () => {
//     render(
//       <MemoryRouter>
//         <AuthScreen mode="login" />
//       </MemoryRouter>
//     );

//     expect(screen.getByText(/Live matches tracked/i)).toBeInTheDocument();
//     expect(screen.queryAllByRole("textbox")).toHaveLength(0);
//   });

//   test("GoogleSignUpButton creates new users", async () => {
//     const user = userEvent.setup();
//     const googleUser = {
//       data: {
//         sub: "sub-1",
//         name: "Alex",
//         email: "alex@example.com",
//         given_name: "Alex",
//         family_name: "Nine",
//         picture: "pic.png",
//       },
//     };

//     (axios.get as jest.Mock)
//       .mockResolvedValueOnce(googleUser)
//       .mockResolvedValueOnce({ data: { exists: false } });
//     (axios.post as jest.Mock).mockResolvedValue({});

//     mockUseGoogleLogin.mockImplementation(({ onSuccess }: any) => async () => {
//       await onSuccess?.({ access_token: "token" });
//     });

//     render(
//       <MemoryRouter>
//         <GoogleSignUpButton />
//       </MemoryRouter>
//     );

//     await user.click(screen.getByRole("button", { name: /Sign up with Google/i }));
//     await screen.findByRole("button", { name: /Sign up with Google/i });

//     expect(axios.post).toHaveBeenCalled();
//     expect(mockSetUser).toHaveBeenCalled();
//     expect(navigateSpy).toHaveBeenCalledWith("/");
//   });

//   test("GoogleLogInButton handles missing accounts", async () => {
//     const user = userEvent.setup();
//     const googleUser = {
//       data: {
//         sub: "sub-2",
//         name: "Sam",
//         email: "sam@example.com",
//         given_name: "Sam",
//         family_name: "Smith",
//         picture: "pic.png",
//       },
//     };

//     (axios.get as jest.Mock)
//       .mockResolvedValueOnce(googleUser)
//       .mockResolvedValueOnce({ data: { exists: false } });

//     mockUseGoogleLogin.mockImplementation(({ onSuccess }: any) => async () => {
//       await onSuccess?.({ access_token: "token" });
//     });

//     render(
//       <MemoryRouter>
//         <GoogleLogInButton />
//       </MemoryRouter>
//     );

//     await user.click(screen.getByRole("button", { name: /Log in with Google/i }));
//     await screen.findByText(/No account found/i);
//     expect(mockSetUser).not.toHaveBeenCalled();
//   });

//   test("GoogleLogInButton logs in existing users", async () => {
//     const user = userEvent.setup();
//     const googleUser = {
//       data: {
//         sub: "sub-3",
//         name: "Taylor",
//         email: "taylor@example.com",
//         given_name: "Taylor",
//         family_name: "Swift",
//         picture: "pic.png",
//       },
//     };

//     (axios.get as jest.Mock)
//       .mockResolvedValueOnce(googleUser)
//       .mockResolvedValueOnce({ data: { exists: true, username: "Taylor" } });

//     mockUseGoogleLogin.mockImplementation(({ onSuccess }: any) => async () => {
//       await onSuccess?.({ access_token: "token" });
//     });

//     render(
//       <MemoryRouter>
//         <GoogleLogInButton />
//       </MemoryRouter>
//     );

//     await user.click(screen.getByRole("button", { name: /Log in with Google/i }));
//     await waitFor(() => expect(mockSetUser).toHaveBeenCalled());
//     expect(navigateSpy).toHaveBeenCalledWith("/");
//   });
// });
