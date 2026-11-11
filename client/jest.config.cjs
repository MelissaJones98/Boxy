// client/jest.config.cjs — Jest settings for the React client.
// (.cjs for the same reason as babel.config.cjs: the package is "type": "module".)

module.exports = {
  // A fake browser (jsdom) so components can render into a `document`.
  // jest-fixed-jsdom is jsdom with Node's real fetch, Request, Response,
  // TextEncoder, etc. put back. Plain jsdom removes them, and MSW needs them
  // to intercept requests.
  testEnvironment: 'jest-fixed-jsdom',

  // Runs after Jest is ready but before each test file: adds the jest-dom
  // matchers and starts the MSW mock API. See src/test/setupTests.js.
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.js'],

  // Components import things Jest can't run as JavaScript. Swap them for stubs:
  moduleNameMapper: {
    // CSS (and CSS modules): identity-obj-proxy returns the class name you
    // asked for, so styles.card is just "card".
    '\\.(css)$': 'identity-obj-proxy',
    // Images: return a fixed file name instead of the file contents.
    '\\.(png|jpe?g|gif|webp|svg)$': '<rootDir>/src/test/fileStub.cjs',
  },

  // Run every JS file (including .mjs/.cjs) through Babel, so `import` syntax
  // works. Jest's default only matches .js/.jsx/.ts/.tsx.
  transform: {
    '\\.[cm]?[jt]sx?$': 'babel-jest',
  },

  // Jest normally skips node_modules when transforming. Some of MSW's own
  // dependencies ship as ES modules only, so they're the exception: the
  // (?!...) means "skip node_modules EXCEPT these packages". If an MSW upgrade
  // fails with "Must use import to load ES Module: .../node_modules/<pkg>/...",
  // add <pkg> to this list.
  transformIgnorePatterns: [
    '/node_modules/(?!(rettime|until-async|@open-draft/deferred-promise)/)',
  ],

  // Tests sit next to the code they test, e.g. src/App.test.jsx.
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx}'],
};
