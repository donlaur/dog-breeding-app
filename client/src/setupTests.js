import { TextEncoder, TextDecoder } from "util";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import "@testing-library/jest-dom";
import { server } from "./mocks/server";

// ✅ Start MSW (Mock Service Worker) before running tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
