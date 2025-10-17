import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ReportModal from "../ReportModal";
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("ReportModal", () => {
beforeEach(() => {
  mockedAxios.post.mockReset();
});

  it("renders nothing when closed", () => {
    render(
      <ReportModal
        isOpen={false}
        matchId={123}
        onClose={jest.fn()}
        onReportSubmitted={jest.fn()}
      />
    );

    expect(screen.queryByText("Submit Report")).not.toBeInTheDocument();
  });

  it("validates empty message before submitting", async () => {
    render(
      <ReportModal
        isOpen
        matchId={456}
        onClose={jest.fn()}
        onReportSubmitted={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(
      await screen.findByText("Please enter a message.")
    ).toBeInTheDocument();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("submits a report and clears message on success", async () => {
    mockedAxios.post.mockResolvedValue({ data: {} });
    const onClose = jest.fn();
    const onReportSubmitted = jest.fn();

    render(
      <ReportModal
        isOpen
        matchId={789}
        onClose={onClose}
        onReportSubmitted={onReportSubmitted}
      />
    );

    const textarea = screen.getByPlaceholderText(
      "Enter your report message..."
    );
    fireEvent.change(textarea, { target: { value: "Suspicious activity" } });

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(
      screen.getByRole("button", { name: "Submitting..." })
    ).toBeDisabled();

    await waitFor(() =>
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "http://localhost:3000/matches/789/reports",
        { message: "Suspicious activity" }
      )
    );

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onReportSubmitted).toHaveBeenCalled();
    expect(textarea).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "Submit" })
    ).not.toBeDisabled();
  });

  it("shows error when submission fails", async () => {
    mockedAxios.post.mockRejectedValue(new Error("fail"));
    const onClose = jest.fn();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ReportModal
        isOpen
        matchId={321}
        onClose={onClose}
        onReportSubmitted={undefined}
      />
    );

    const textarea = screen.getByPlaceholderText(
      "Enter your report message..."
    );
    fireEvent.change(textarea, { target: { value: "Issue noted" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(
      screen.getByRole("button", { name: "Submitting..." })
    ).toBeDisabled();

    await waitFor(() =>
      expect(
        screen.getByText("Failed to submit report. Please try again.")
      ).toBeInTheDocument()
    );

    expect(onClose).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Submit" })
    ).not.toBeDisabled();

    consoleSpy.mockRestore();
  });
});
