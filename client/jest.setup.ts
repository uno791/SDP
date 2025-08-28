// jest.setup.ts
import 'jest-canvas-mock';      // for any <canvas> usage
import 'whatwg-fetch';          // bring `fetch`/Request/Response into the env
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'node:util';
Object.assign(globalThis as any, { TextEncoder, TextDecoder });


// mock out your config import so no real network calls to other endpoints happen
jest.mock('@/config', () => ({
  baseURL: 'http://localhost:3000',
}));


// a bare-bones ResizeObserver stub for any components that use it
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserver;

// ── CHART.JS & REACT-CHARTJS-2 STUBS ─────────────────────────────────────────
jest.mock(
  'react-chartjs-2',
  () => ({
    __esModule: true,
    Bar: () => null,
    Line: () => null,
    Pie: () => null,
    Doughnut: () => null,
  }),
  { virtual: true }
);

jest.mock(
  'chart.js',
  () => ({
    __esModule: true,
    Chart: class { update() {}; destroy() {} },
    register: () => {},
  }),
  { virtual: true }
);


// ── HTML2CANVAS & JSPDF STUBS ────────────────────────────────────────────────
jest.mock('html2canvas', () => ({
  __esModule: true,
  default: jest.fn(() =>
    Promise.resolve({
      toDataURL: () => 'data:image/png;base64,stub',
    })
  ),
}));

jest.mock('jspdf', () => ({
  __esModule: true,
  jsPDF: jest.fn(() => ({
    addImage: jest.fn(),
    save: jest.fn(),
  })),
}));

// ── your existing sales-data fetch spy ───────────────────────────────────────
const fakeSalesData = [
  { month: 1, monthName: 'January', total: 0 },
  { month: 2, monthName: 'February', total: 0 },
  { month: 3, monthName: 'March', total: 0 },
];

let fetchSpy: jest.SpyInstance;

beforeAll(() => {
  fetchSpy = jest
    .spyOn(globalThis as any, 'fetch')
    .mockImplementation((input: any) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof Request
          ? input.url
          : '';

      if (url.endsWith('/sales-data')) {
        return Promise.resolve(
          new Response(JSON.stringify(fakeSalesData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }

      return Promise.reject(new Error(`Unhandled fetch call to ${url}`));
    });
});

afterAll(() => {
  fetchSpy.mockRestore();
});
