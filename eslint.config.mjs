import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/dist-electron/**",
      "**/.next/**",
      "**/coverage/**",
      "**/node_modules/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [
      "apps/desktop-v3/src/**/*.{ts,tsx}"
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: [
      "apps/desktop-v3/**/*.{ts,tsx}",
      "*.config.{js,mjs,ts}",
      "apps/**/*.config.{js,mjs,ts}"
    ],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          "fixStyle": "inline-type-imports"
        }
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_"
        }
      ]
    }
  }
);
