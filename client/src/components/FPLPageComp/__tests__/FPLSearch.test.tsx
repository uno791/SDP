import { render, screen, fireEvent } from "@testing-library/react";
import FPLSearch from "../FPLSearch/FPLSearch";

describe("FPLSearch Component", () => {
  test("renders input and button", () => {
    const mockSelect = jest.fn();
    render(<FPLSearch onSelectTeam={mockSelect} />);

    // Heading and input should be visible
    expect(screen.getByText(/enter your fpl team id/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/enter your team id/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go/i })).toBeInTheDocument();
  });

  test("shows error when invalid input is submitted", () => {
    const mockSelect = jest.fn();
    render(<FPLSearch onSelectTeam={mockSelect} />);

    const input = screen.getByPlaceholderText(/enter your team id/i);
    const button = screen.getByRole("button", { name: /go/i });

    fireEvent.change(input, { target: { value: "-5" } });
    fireEvent.click(button);

    expect(
      screen.getByText(/please enter a valid numeric team id/i)
    ).toBeInTheDocument();
    expect(mockSelect).not.toHaveBeenCalled();
  });

  test("calls onSelectTeam with a valid numeric team id", () => {
    const mockSelect = jest.fn();
    render(<FPLSearch onSelectTeam={mockSelect} />);

    const input = screen.getByPlaceholderText(/enter your team id/i);
    const button = screen.getByRole("button", { name: /go/i });

    fireEvent.change(input, { target: { value: "123" } });
    fireEvent.click(button);

    expect(mockSelect).toHaveBeenCalledWith(123);
    expect(
      screen.queryByText(/please enter a valid numeric team id/i)
    ).toBeNull();
  });

  test("clears error when valid input is provided after an invalid one", () => {
    const mockSelect = jest.fn();
    render(<FPLSearch onSelectTeam={mockSelect} />);

    const input = screen.getByPlaceholderText(/enter your team id/i);
    const button = screen.getByRole("button", { name: /go/i });

    // Trigger invalid input first
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.click(button);
    expect(
      screen.getByText(/please enter a valid numeric team id/i)
    ).toBeInTheDocument();

    // Then correct it
    fireEvent.change(input, { target: { value: "42" } });
    fireEvent.click(button);

    expect(
      screen.queryByText(/please enter a valid numeric team id/i)
    ).toBeNull();
    expect(mockSelect).toHaveBeenCalledWith(42);
  });
});
