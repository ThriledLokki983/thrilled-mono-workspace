import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global test setup for components package
// This file is imported by vitest to set up the testing environment

// Mock IntersectionObserver if needed for React Aria components
if (!(global as any).IntersectionObserver) {
  (global as any).IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  };
}

// Mock ResizeObserver if needed
if (!(global as any).ResizeObserver) {
  (global as any).ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  };
}

// Setup for React Aria Components testing
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.getComputedStyle for React Aria Components
Object.defineProperty(globalThis, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});
