import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/unit/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["<rootDir>/tests/unit/**/*.test.ts?(x)"],
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/__mocks__/**",
  ],
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/", "/tokens/build/"],
  coverageThreshold: {
    "lib/": { statements: 90, branches: 85 },
    global: { statements: 75 },
  },
};

export default createJestConfig(config);
