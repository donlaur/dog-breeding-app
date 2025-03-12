// Mock implementation of TextEncoder/TextDecoder
global.TextEncoder = class TextEncoder {
  encode(str) {
    const buf = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      buf[i] = str.charCodeAt(i);
    }
    return buf;
  }
};

global.TextDecoder = class TextDecoder {
  decode(buf) {
    let result = '';
    for (let i = 0; i < buf.length; i++) {
      result += String.fromCharCode(buf[i]);
    }
    return result;
  }
};

// Add fetch polyfill for Node environment
require('whatwg-fetch');

import "@testing-library/jest-dom";
import { server } from "./mocks/server";
import { toMatchImageSnapshot } from 'jest-image-snapshot';

// ✅ Start MSW (Mock Service Worker) before running tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

expect.extend({ toMatchImageSnapshot });

// Configure image snapshot settings
const customConfig = {
  // Threshold for pixel difference
  failureThreshold: 0.01,
  failureThresholdType: 'percent',
  // Update snapshots automatically in CI
  updateSnapshot: process.env.CI === 'true',
  // Custom snapshot directory
  customSnapshotsDir: '__image_snapshots__'
};

beforeEach(() => {
  // Set up any global test configuration
  jest.setTimeout(10000); // Increase timeout for image processing
  
  // Clear any mocks/spies
  jest.clearAllMocks();
  
  // Reset any localStorage/sessionStorage
  localStorage.clear();
  sessionStorage.clear();
});
