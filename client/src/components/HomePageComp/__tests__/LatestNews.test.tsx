import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LatestNews from "../LastestNews/LastestNews";
import { fetchEplNews } from "../../../api/espn";

jest.mock("../../../api/espn", () => ({
  fetchEplNews: jest.fn(),
}));

const mockFetch = fetchEplNews as jest.MockedFunction<typeof fetchEplNews>;

describe("LatestNews", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders news articles after load", async () => {
    mockFetch.mockResolvedValue({
      articles: [
        {
          headline: "Big win for the Reds",
          description: "Liverpool cruise to victory.",
          published: "",
          links: { web: { href: "https://example.com/story" } },
          images: [{ url: "https://img" }],
          byline: "By Sports Desk",
          categories: [{ type: "recap", description: "Match Report" }],
          type: "recap",
        },
      ],
    });

    render(<LatestNews />);

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /latest news/i })).toBeInTheDocument()
    );

    await waitFor(() =>
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    );
    expect(screen.getByText(/Big win for the Reds/i)).toBeInTheDocument();
    expect(screen.getByText(/Liverpool cruise/i)).toBeInTheDocument();
    expect(screen.getByText(/By Sports Desk/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Big win for the Reds/i })).toHaveAttribute(
      "href",
      "https://example.com/story"
    );
  });

  test("shows fallback when there are no headlines", async () => {
    mockFetch.mockResolvedValue({ articles: [] });

    render(<LatestNews />);

    await waitFor(() =>
      expect(screen.getByText(/No headlines yet/i)).toBeInTheDocument()
    );
  });

  test("surfaces load errors", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));

    render(<LatestNews />);

    await waitFor(() =>
      expect(screen.getByText(/network down/i)).toBeInTheDocument()
    );
  });
});
