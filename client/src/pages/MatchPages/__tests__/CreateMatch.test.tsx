import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

import CreateMatch from "../CreateMatch";
import { renderWithUser } from "../../../Tests/test-utils";

const parseMock = jest.fn();
jest.mock("papaparse", () => ({
  __esModule: true,
  default: { parse: (...args: unknown[]) => parseMock(...args) },
}));

const matchFormMock = jest.fn(({ csvData }: { csvData: unknown }) => (
  <div data-testid="match-form">{csvData ? "loaded" : "empty"}</div>
));
jest.mock("../../../components/MatchPageComp/MatchForm", () => ({
  __esModule: true,
  default: (props: any) => matchFormMock(props),
}));

const renderCreateMatch = () =>
  renderWithUser(
    <MemoryRouter>
      <CreateMatch />
    </MemoryRouter>
  );

describe("CreateMatch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders and passes initial csv data to the form", () => {
    renderCreateMatch();

    expect(screen.getByText(/UPLOAD AS A CSV/i)).toBeInTheDocument();
    expect(matchFormMock).toHaveBeenCalledWith(
      expect.objectContaining({ csvData: null })
    );
  });

  test("parses uploaded csv and forwards mapped data", () => {
    const csvRow = [
      "Arsenal",
      "Chelsea",
      "2024-05-01",
      "20:00",
      "105",
      "Player1;Player2",
      "Player3;Player4",
    ];
    const parseResult = {
      data: [csvRow],
      errors: [],
      meta: {
        delimiter: ",",
        linebreak: "\n",
        aborted: false,
        truncated: false,
        cursor: 0,
      },
    };

    parseMock.mockImplementation((_file, config: any) => {
      config?.complete?.(parseResult);
    });

    const { container } = renderCreateMatch();
    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const file = new File(["content"], "match.csv", { type: "text/csv" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(parseMock).toHaveBeenCalledWith(file, expect.any(Object));

    const lastCall = matchFormMock.mock.calls[matchFormMock.mock.calls.length - 1];
    expect(lastCall?.[0].csvData).toEqual({
      team1: "Arsenal",
      team2: "Chelsea",
      date: "2024-05-01",
      time: "20:00",
      duration: "105",
      lineupTeam1: "Player1;Player2",
      lineupTeam2: "Player3;Player4",
    });
    expect(screen.getByTestId("match-form")).toHaveTextContent("loaded");
  });
});
