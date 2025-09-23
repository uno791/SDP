const renderMock = jest.fn();
const createRootMock = jest.fn(() => ({ render: renderMock }));

jest.mock("react-dom/client", () => ({
  createRoot: createRootMock,
}));

describe("main entrypoint", () => {
  beforeEach(() => {
    document.body.innerHTML = "<div id='root'></div>";
    createRootMock.mockClear();
    renderMock.mockClear();
  });

  test("initializes React root", async () => {
    await import("../main");

    expect(createRootMock).toHaveBeenCalledTimes(1);
    expect(createRootMock.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
    expect(renderMock).toHaveBeenCalledWith(expect.anything());
  });
});
