import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

jest.mock("../../config", () => ({ baseURL: "http://api.local" }));

import CreateMatch from "../MatchPages/CreateMatch";

jest.mock("../../Users/UserContext", () => ({
  useUser: () => ({ user: { id: "user-1", username: "demo" } }),
}));

const papaMocks = { parse: jest.fn() };
jest.mock("papaparse", () => ({
  __esModule: true,
  default: { parse: (...args: any[]) => papaMocks.parse(...args) },
  parse: (...args: any[]) => papaMocks.parse(...args),
}));

jest.mock("../../components/MatchPageComp/MatchForm", () => (
  props: any,
) => (
  <div data-testid="match-form">
    <button onClick={props.onCancel}>Cancel</button>
    <pre data-testid="csv-data">{JSON.stringify(props.csvData)}</pre>
  </div>
));

describe("CreateMatch page", () => {
  beforeEach(() => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue({ ok: true, json: async () => ({ match: null }) } as any);
    papaMocks.parse.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("allows downloading template and uploading csv", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/create-match"]}>
        <Routes>
          <Route path="/create-match" element={<CreateMatch />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/UPLOAD AS A CSV/)).toBeInTheDocument();

    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const file = new File([
      "Team A,Team B,2024-05-01,19:30,95,Player1;Player2;Player3,Player4;Player5;Player6",
    ], "match.csv", { type: "text/csv" });

    papaMocks.parse.mockImplementation((_: any, opts: any) => {
      opts.complete({ data: [["Team A", "Team B", "2024-05-01", "19:30", "95", "A;B", "C;D"]] });
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByTestId("csv-data").textContent).toContain("Team A"));
  });
});
