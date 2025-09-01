/** @type {import('jest').Config} */
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",

  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
        diagnostics: {
          warnOnly: true,
          // Keep these quiet during coverage collection
          ignoreCodes: [6133, 6192, 1343, 2307],
        },
      },
    ],
  },

  // DO NOT mark files as ESM for Jest here
  // extensionsToTreatAsEsm: [],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
    "^.+\\.(css|sass|scss)$": "<rootDir>/_mocks_/styleMock.js",
    "^.+\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/_mocks_/fileMock.js",
    "^react-phone-number-input/style.css$": "<rootDir>/_mocks_/styleMock.js",
  },

  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["json", "lcov", "text", "clover"],

  // ← IMPORTANT: include pages so the stuff you render actually counts
  collectCoverageFrom: [
    "src/**/*.{ts,tsx,js,jsx}",
    "!src/**/*.d.ts",
    "!src/api/**",
    "!src/config.ts", // uses import.meta – exclude from coverage
  ],

  coveragePathIgnorePatterns: ["/node_modules/", "/dist/"],
};
