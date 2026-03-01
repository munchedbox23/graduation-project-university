/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-standard"],
  customSyntax: "postcss-styled-syntax",

  rules: {
    "color-no-invalid-hex": true,
    "color-function-notation": null,
    "color-function-alias-notation": null,
    "nesting-selector-no-missing-scoping-root": null,
    "declaration-block-no-duplicate-properties": true,
    "alpha-value-notation": null,
    "declaration-property-value-no-unknown": null,
    "keyframe-block-no-duplicate-selectors": null,
  },

  ignoreFiles: [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/*.config.*",
  ],
};
