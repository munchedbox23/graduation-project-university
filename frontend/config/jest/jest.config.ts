/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
import type { Config } from "jest";

const config: Config = {
  globals: {
    __IS_DEV__: true,
    __API__: "",
    __PROJECT__: "jest",
  },
  rootDir: "../../",
  testEnvironment: "jsdom",
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: ["\\\\node_modules\\\\"],
  coverageProvider: "babel",
  moduleDirectories: ["node_modules"],
  roots: ["<rootDir>/src"],
  moduleFileExtensions: ["js", "mjs", "cjs", "jsx", "ts", "mts", "cts", "tsx", "json", "node"],
  modulePaths: ["<rootDir>src"],
  setupFilesAfterEnv: ["<rootDir>/config/jest/setup-jest.ts"],

  testMatch: [
    "<rootDir>src/**/*(*.)@(spec|test).[tj]s?(x)",
    "**/__tests__/**/*.?([mc])[jt]s?(x)",
    "**/?(*.)+(spec|test).?([mc])[jt]s?(x)",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/build/"],
  reporters: [
    "default",
    [
      "jest-html-reporters",
      {
        publicPath: "<rootDir>/reports/unit",
        filename: "report.html",
        openReport: true,
      },
    ],
  ],
};

export default config;
