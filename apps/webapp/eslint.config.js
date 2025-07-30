import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";
import drizzle from "eslint-plugin-drizzle";
import importPlugin from "eslint-plugin-import";
import svelte from "eslint-plugin-svelte";

export default [
  js.configs.recommended,
  {
    ignores: [
      ".svelte-kit/**",
      "build/**",
      "dist/**",
      "node_modules/**",
      "*.config.js",
      "*.config.ts",
    ],
  },
  {
    files: ["**/*.{js,ts}"],
    plugins: {
      "@typescript-eslint": typescript,
      drizzle,
      import: importPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...drizzle.configs.recommended.rules,

      // Only keep import rules that Prettier doesn't handle
      "import/no-duplicates": "error",
      "import/no-unresolved": "off", // Turn off since TypeScript handles this
      "import/extensions": "off", // Turn off since TypeScript handles this
    },
  },
  {
    files: ["**/*.svelte"],
    plugins: {
      svelte,
      import: importPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        parser: typescriptParser,
        extraFileExtensions: [".svelte"],
      },
    },
    rules: {
      ...svelte.configs.recommended.rules,
      // Only keep import rules that Prettier doesn't handle
      "import/no-duplicates": "error",
      "import/no-unresolved": "off",
      "import/extensions": "off",
    },
  },
  prettier,
];
