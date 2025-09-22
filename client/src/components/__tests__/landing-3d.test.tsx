import { render, screen, fireEvent, act } from "@testing-library/react";
import Loader3D from "../LandingPageComp/Layout/Loader3D";
import ThreeFootball from "../LandingPageComp/ThreeFootball";

const useFrameMock = jest.fn();

jest.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame: (...args: unknown[]) => useFrameMock(...args),
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

  beforeEach(() => {
    useFrameMock.mockClear();
    useFrameMock.mockImplementation(() => undefined);
    mockUseGLTF.mockReset();
    mockUseGLTF.mockReturnValue({ scene: { traverse: jest.fn() } });
    mockUseGLTF.preload?.mockReset?.();
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
    expect(useFrameMock).toHaveBeenCalled();
  });

  test("ThreeFootball falls back to checker ball when model missing", () => {
    mockUseGLTF.mockReturnValueOnce({ scene: null });

    const { container } = render(<ThreeFootball />);

    expect(container.querySelector("icosahedrongeometry")).toBeTruthy();
  });

  test("ThreeFootball adjusts spin speed via pointer events", () => {
    const { container } = render(<ThreeFootball />);
    const group = container.querySelector("group");
    expect(group).toBeTruthy();

    if (group) {
      fireEvent.pointerOver(group);
      fireEvent.pointerDown(group);
      fireEvent.pointerUp(group);
      fireEvent.pointerOut(group);
    }
  });

  test("ThreeFootball rotates the football on each frame", async () => {
    const callbacks: Array<(state: any, delta: number) => void> = [];
    useFrameMock.mockImplementation((cb: any) => {
      callbacks.push(cb);
    });

    const previousRotationDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "rotation"
    );
    Object.defineProperty(HTMLElement.prototype, "rotation", {
      configurable: true,
      writable: true,
      value: { x: 0, y: 0, z: 0 },
    });

    const { container } = render(<ThreeFootball />);
    const group = container.querySelector("group") as any;
    expect(group).toBeTruthy();

    if (!group) return;

    expect(callbacks.length).toBeGreaterThan(0);
    const lastCallback = callbacks[callbacks.length - 1];
    expect(typeof lastCallback).toBe("function");

    act(() => {
      lastCallback?.({ clock: { getElapsedTime: () => 2 } }, 0.5);
    });

    expect(group.rotation.y).not.toBe(0);

    if (previousRotationDescriptor) {
      Object.defineProperty(HTMLElement.prototype, "rotation", previousRotationDescriptor);
    } else {
      delete (HTMLElement.prototype as any).rotation;
    }

    useFrameMock.mockImplementation(() => undefined);
  });

  test("ThreeFootball marks mesh parts to cast and receive shadows", () => {
    const mesh: any = { isMesh: true };
    mockUseGLTF.mockReturnValueOnce({
      scene: {
        traverse: (fn: (obj: any) => void) => fn(mesh),
      },
    });

    render(<ThreeFootball />);

    expect(mesh.castShadow).toBe(true);
    expect(mesh.receiveShadow).toBe(true);
  });
});
