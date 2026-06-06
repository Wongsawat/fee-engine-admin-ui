import '@testing-library/jest-dom/vitest';
import { server } from './mocks/server';

// Polyfill pointer capture APIs for Radix UI Select in jsdom
if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.hasPointerCapture = HTMLElement.prototype.hasPointerCapture ?? (() => false);
  HTMLElement.prototype.setPointerCapture = HTMLElement.prototype.setPointerCapture ?? (() => {});
  HTMLElement.prototype.releasePointerCapture = HTMLElement.prototype.releasePointerCapture ?? (() => {});
  HTMLElement.prototype.scrollIntoView = HTMLElement.prototype.scrollIntoView ?? (() => {});
}

// Polyfill ResizeObserver for cmdk (used by shadcn Command) in jsdom
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver = ResizeObserverStub;
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
