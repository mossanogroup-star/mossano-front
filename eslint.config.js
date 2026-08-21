import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "audit-shots", "public"] },

  // The app itself: TypeScript, React, browser.
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },

  // The audit scripts are plain JavaScript running in Node — but the bodies of
  // `page.evaluate()` are serialised and executed inside the browser, so they
  // legitimately reference `document` and `window`. Both sets of globals apply.
  {
    extends: [js.configs.recommended],
    files: ["scripts/**/*.mjs", "*.config.js", "*.config.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },

  // Entry points and route tables. They export route arrays and helpers
  // alongside components by design, which is exactly what react-refresh warns
  // about — the warning is aimed at component modules, and none of these are.
  {
    files: ["src/entry-client.tsx", "src/entry-server.tsx", "src/app/router/*.tsx"],
    rules: { "react-refresh/only-export-components": "off" },
  },

  // Plain-JS data modules: the transcribed catalogue and the palette.
  {
    extends: [js.configs.recommended],
    files: ["src/data/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
    },
  },
);
