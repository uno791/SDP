import { render, screen } from "@testing-library/react";
import FPLTeamLineup from "../FPLDashboard/FPLTeamLineup"; // adjust path if needed

describe("FPLTeamLineup Component", () => {
  const mockPlayers = {
    1: { id: 1, web_name: "Alisson", photo: "12345.jpg", element_type: 1 },
    2: { id: 2, web_name: "Trent", photo: "23456.jpg", element_type: 2 },
    3: { id: 3, web_name: "Van Dijk", photo: "34567.jpg", element_type: 2 },
    4: { id: 4, web_name: "Salah", photo: "45678.jpg", element_type: 3 },
    5: { id: 5, web_name: "Darwin", photo: "56789.jpg", element_type: 4 },
    6: { id: 6, web_name: "Robertson", photo: "67890.jpg", element_type: 2 },
    7: { id: 7, web_name: "Jota", photo: "78901.jpg", element_type: 3 },
    8: { id: 8, web_name: "Mac Allister", photo: "89012.jpg", element_type: 3 },
    9: { id: 9, web_name: "Diaz", photo: "90123.jpg", element_type: 3 },
    10: { id: 10, web_name: "Gakpo", photo: "01234.jpg", element_type: 4 },
    11: { id: 11, web_name: "Kelleher", photo: "11111.jpg", element_type: 1 },
    12: { id: 12, web_name: "Konate", photo: "22222.jpg", element_type: 2 },
  };

  const mockPicks = [
    // Starting XI
    { element: 1, position: 1, is_captain: false, is_vice_captain: false },
    { element: 2, position: 2, is_captain: false, is_vice_captain: false },
    { element: 3, position: 3, is_captain: false, is_vice_captain: false },
    { element: 6, position: 4, is_captain: false, is_vice_captain: false },
    { element: 4, position: 5, is_captain: true, is_vice_captain: false }, // captain
    { element: 7, position: 6, is_captain: false, is_vice_captain: false },
    { element: 8, position: 7, is_captain: false, is_vice_captain: false },
    { element: 9, position: 8, is_captain: false, is_vice_captain: false },
    { element: 5, position: 9, is_captain: false, is_vice_captain: true }, // vice
    { element: 10, position: 10, is_captain: false, is_vice_captain: false },
    { element: 11, position: 11, is_captain: false, is_vice_captain: false },

    // Bench
    { element: 12, position: 12, is_captain: false, is_vice_captain: false },
  ];

  test("renders all main sections", () => {
    render(<FPLTeamLineup picks={mockPicks} players={mockPlayers} />);
    expect(screen.getByText(/starting xi/i)).toBeInTheDocument();
    expect(screen.getByText(/bench/i)).toBeInTheDocument();
  });

  test("renders correct players by position", () => {
    render(<FPLTeamLineup picks={mockPicks} players={mockPlayers} />);
    expect(screen.getByText("Alisson")).toBeInTheDocument(); // GK
    expect(screen.getByText("Trent")).toBeInTheDocument(); // DEF
    expect(screen.getByText("Salah")).toBeInTheDocument(); // MID
    expect(screen.getByText("Darwin")).toBeInTheDocument(); // FWD
  });

  test("renders captain and vice captain badges", () => {
    render(<FPLTeamLineup picks={mockPicks} players={mockPlayers} />);
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("VC")).toBeInTheDocument();
  });

  test("renders bench players correctly", () => {
    render(<FPLTeamLineup picks={mockPicks} players={mockPlayers} />);
    expect(screen.getByText("Konate")).toBeInTheDocument();
  });

  test("handles missing player gracefully", () => {
    const incompletePlayers: Record<number, any> = { ...mockPlayers };
    delete (incompletePlayers as any)[1]; // safely remove Alisson

    render(<FPLTeamLineup picks={mockPicks} players={incompletePlayers} />);
    expect(screen.queryByText("Alisson")).not.toBeInTheDocument();
  });
});
