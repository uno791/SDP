import { render, screen } from "@testing-library/react";
import Loader3D from "../LandingPageComp/Layout/Loader3D";
import ThreeFootball from "../LandingPageComp/ThreeFootball";

jest.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame: jest.fn(),
}));

jest.mock("@react-three/drei", () => {
  const useGLTFMock = jest.fn(() => ({ scene: { traverse: jest.fn() } }));
  Object.assign(useGLTFMock, { preload: jest.fn() });
  return {
    Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Center: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Bounds: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Environment: () => <div data-testid="env" />,
    OrbitControls: () => <div data-testid="orbit" />,
    useGLTF: useGLTFMock,
  };
});

const { useGLTF: mockUseGLTF } = require("@react-three/drei") as {
  useGLTF: jest.Mock & { preload?: jest.Mock };
};

jest.mock("framer-motion", () => ({
  motion: { div: ({ children, style }: any) => <div style={style}>{children}</div> },
  useScroll: () => ({ scrollY: { on: jest.fn() } }),
  useTransform: () => 0,
}));

describe("3D landing components", () => {
  beforeAll(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: () => ({
        fillStyle: "",
        fillRect: jest.fn(),
      }),
    });
  });

  test("Loader3D renders loading text", () => {
    render(<Loader3D />);
    expect(screen.getByText(/FootBook — loading live data…/)).toBeInTheDocument();
    expect(mockUseGLTF).toHaveBeenCalled();
  });

  test("ThreeFootball renders canvas content", () => {
    render(<ThreeFootball />);
    expect(screen.getByTestId("canvas")).toBeInTheDocument();
    expect(mockUseGLTF).toHaveBeenCalled();
  });
});
