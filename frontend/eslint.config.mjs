import pluginBox from "eslint-plugin-box";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

import js from "@eslint/js";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: { globals: globals.browser },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  eslintPluginPrettierRecommended,
  {
    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
      "prefer-const": "off",
      "react/react-in-jsx-scope": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "prettier/prettier": "off",
    },
  },
  {
    plugins: {
      box: pluginBox,
    },
    rules: {
      "box/layer-import": [
        "error",
        {
          alias: "@",
          ignoreImportPatterns: ["**/store-provider"],
        },
      ],
      "box/public-api-checker": ["error", { alias: "@" }],
    },
  },
]);
