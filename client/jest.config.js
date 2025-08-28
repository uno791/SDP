// jest.config.js
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.jest.json",
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleNameMapper: {
    "^react$": "<rootDir>/node_modules/react",
    "^react-dom$": "<rootDir>/node_modules/react-dom",
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
    "^.+\\.(css|sass|scss)$": "<rootDir>/_mocks_/styleMock.js",
    "^.+\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/_mocks_/fileMock.js",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^react-phone-number-input/style.css$": "<rootDir>/_mocks_/styleMock.js",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}", "!src/**/*.d.ts"],
  coverageReporters: ["json", "lcov", "text", "clover"],


  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
      diagnostics: { warnOnly: true }
    }
  }
};

// };
