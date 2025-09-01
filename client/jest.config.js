// jest.config.js
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",

  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.jest.json",
        diagnostics: { warnOnly: true },
      },
    ],
  },

  extensionsToTreatAsEsm: [".ts", ".tsx"],

  moduleNameMapper: {
    "^react$": "<rootDir>/node_modules/react",
    "^react-dom$": "<rootDir>/node_modules/react-dom",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
    "^.+\\.(css|sass|scss)$": "<rootDir>/_mocks_/styleMock.js",
    "^.+\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/_mocks_/fileMock.js",
    "^react-phone-number-input/style.css$": "<rootDir>/_mocks_/styleMock.js",
  },

  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  collectCoverage: true,
  coverageReporters: ["json", "lcov", "text", "clover"],
  coverageDirectory: "coverage",

  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/api/**",
    "!src/pages/**",
  ],

  coveragePathIgnorePatterns: ["/node_modules/", "/dist/"],
};
