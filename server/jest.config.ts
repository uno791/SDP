import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["ts", "tsx", "js"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/server.ts",
  ],
  coverageReporters: ["text", "lcov"],
  coverageDirectory: "<rootDir>/coverage",
};

export default config;
