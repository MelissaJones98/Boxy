// src/test/setupTests.js — runs before every client test file
// (registered as "setupFilesAfterEnv" in jest.config.cjs).

// Adds DOM-specific matchers to expect(), such as
// expect(button).toBeDisabled() or expect(heading).toBeInTheDocument().
import '@testing-library/jest-dom';

import { server } from './server';

// Start intercepting requests before any test runs. 'error' makes any request
// WITHOUT a matching handler fail the test loudly, so a typo in a URL, or a
// call we forgot to mock, can't silently hit the real network.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Remove any per-test server.use(...) overrides, so one test's mocked error
// can't leak into the next test.
afterEach(() => server.resetHandlers());

// Stop intercepting once the file's tests are done.
afterAll(() => server.close());
