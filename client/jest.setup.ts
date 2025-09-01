// Basic matchers
import '@testing-library/jest-dom';

// Fetch polyfill (only if your components call fetch)
import 'whatwg-fetch';

// Node polyfills used by jsdom
import { TextEncoder, TextDecoder } from 'util';
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder as any;

// ResizeObserver (many UI libs assume it's present)
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as any).ResizeObserver = (global as any).ResizeObserver || RO;

// Keep config local so tests don't hit real endpoints
jest.mock('@/config', () => ({
  baseURL: 'http://localhost:3000',
}));
