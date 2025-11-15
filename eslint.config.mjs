import js from "@eslint/js";
import nextConfig from "eslint-config-next";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import testingLibrary from "eslint-plugin-testing-library";

/**
 * Flat ESLint config for:
 * - ESLint 9.x
 * - Next.js 16.x
 * - TypeScript via @typescript-eslint
 * - Testing Library for React tests
 *
 * Notes:
 * - No @eslint/compat or @eslint/eslintrc usage.
 * - eslint-config-next is used as a flat config (spread into the array).
 */
// eslint-disable-next-line import/no-anonymous-default-export
export default [
  // Base JS recommended rules
  js.configs.recommended,

  // Next.js + React rules (flat config from eslint-config-next@16)
  ...nextConfig,

  // Global language options and common globals
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Node.js globals
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
      },
    },
  },

  // TypeScript-specific config
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: ["./tsconfig.json"],
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // Disable the base rule for TS files
      "no-unused-vars": "off",
      // TS-aware unused vars rule with underscore support
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Jest / Testing globals in test files
  {
    files: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
    languageOptions: {
      globals: {
        // Jest globals
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly",
      },
    },
  },

  // Testing Library rules for React tests (flat config from the plugin)
  {
    files: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
    ...testingLibrary.configs.react,
  },
];
