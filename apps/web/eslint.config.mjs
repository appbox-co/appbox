// ESLint 9 flat config for Next.js
import eslint from "@eslint/js"
import nextPlugin from "@next/eslint-plugin-next"
import tseslint from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import prettierPlugin from "eslint-plugin-prettier/recommended"
import reactPlugin from "eslint-plugin-react"
import reactHooksPlugin from "eslint-plugin-react-hooks"

// Define config array
const config = [
  // Global ignores configuration
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".contentlayer/**",
      ".turbo/**",
      "public/**"
    ]
  },

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
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "@next/next": nextPlugin
    },
    rules: {
      // Next.js rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-html-link-for-pages": "off",
      "no-undef": "off",

      // JavaScript rules
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],

      // React rules
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": [
        "error",
        { ignore: ["tw", "jsx", "global"] }
      ],
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
      "react/require-render-return": "error",

      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn"
    },
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
    plugins: {
      "@typescript-eslint": tseslint
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module"
      }
    },
    rules: {
      // Disable base rule in favor of TypeScript rule
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      // Allow function/type name collision (common pattern in React)
      "no-redeclare": "off"
    }
  },

  // Config files override (CommonJS)
  {
    files: ["**/next.config.js", "**/*.config.js", "**/*.config.cjs"],
    languageOptions: {
      globals: {
        module: "readonly",
        require: "readonly",
        __dirname: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-var-requires": "off"
    }
  },

  // Prettier (must be last)
  prettierPlugin
]

export default config
