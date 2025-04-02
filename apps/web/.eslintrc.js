module.exports = {
  root: true,
  extends: [
    "next/core-web-vitals",
    "plugin:prettier/recommended",
    "plugin:tailwindcss/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
  ],
  plugins: ["tailwindcss", "prettier", "@typescript-eslint"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "tailwindcss/no-custom-classname": "off",
    "tailwindcss/classnames-order": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "react/react-in-jsx-scope": "off",
    "react/no-unknown-property": ["error", { ignore: ["tw"] }],
  },
  settings: {
    tailwindcss: {
      callees: ["cn", "cva"],
      config: "tailwind.config.cjs",
    },
    next: {
      rootDir: ["src/"],
    },
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    {
      files: ["next.config.js", "*.config.js"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
  ],
}
