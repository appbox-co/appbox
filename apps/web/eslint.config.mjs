// Import the compatibility utility to handle old-style configs
import { fixupConfigRules } from "@eslint/compat"
import { FlatCompat } from "@eslint/eslintrc"
import eslint from "@eslint/js"
import tsParser from "@typescript-eslint/parser"
import prettierPlugin from "eslint-plugin-prettier/recommended"
import { defineConfig, globalIgnores } from "eslint/config"

// Temporarily removing tailwindcss plugin due to compatibility issues
// import tailwindcssPlugin from 'eslint-plugin-tailwindcss';

// Create the compatibility instance
const compat = new FlatCompat()

// Define config array first
const config = [
  // Global ignores configuration
  globalIgnores(
    [
      "node_modules/**",
      ".next/**",
      ".contentlayer/**",
      ".turbo/**",
      "public/**"
    ],
    "Ignore build and generated directories"
  ),

  eslint.configs.recommended,
  {
    // Global settings
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module"
    }
  },

  // Base configuration for all files
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    rules: {
      // Next rules
      "@next/next/no-html-link-for-pages": "off",
      "no-undef": "off",

      // Tailwind rules - commenting out
      // 'tailwindcss/no-custom-classname': 'off',
      // 'tailwindcss/classnames-order': 'error',

      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],

      // JavaScript rules
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],

      // React rules
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": ["error", { ignore: ["tw"] }],

      // Add react recommended rules manually
      "react/display-name": "warn",
      "react/jsx-key": "warn",
      "react/jsx-no-comment-textnodes": "warn",
      "react/jsx-no-duplicate-props": "warn",
      "react/jsx-no-target-blank": "warn",
      "react/jsx-no-undef": "error",
      "react/jsx-uses-react": "warn",
      "react/jsx-uses-vars": "warn",
      "react/no-children-prop": "warn",
      "react/no-danger-with-children": "warn",
      "react/no-deprecated": "warn",
      "react/no-direct-mutation-state": "warn",
      "react/no-find-dom-node": "warn",
      "react/no-is-mounted": "warn",
      "react/no-render-return-value": "warn",
      "react/no-string-refs": "warn",
      "react/no-unescaped-entities": "warn",
      "react/prop-types": "warn",
      "react/require-render-return": "error"
    },
    // Removed Tailwind settings
    settings: {
      react: {
        version: "detect"
      },
      next: {
        rootDir: ["src/"]
      }
    }
  },

  // TypeScript specific configuration
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module"
      }
    }
  },

  // Config files override
  {
    files: ["**/next.config.js", "**/*.config.js"],
    rules: {
      "@typescript-eslint/no-var-requires": "off"
    }
  },

  // Use the compatibility utility for Next.js core-web-vitals
  ...fixupConfigRules(
    compat.config({
      extends: ["next", "next/core-web-vitals", "next/typescript"]
    })
  ),

  // Prettier
  prettierPlugin
]

// Then export that variable
export default defineConfig(config)
