module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: { project: "./tsconfig.json", sourceType: "module" },
    plugins: ["@typescript-eslint"],
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    rules: {
        "@typescript-eslint/comma-dangle": ["off"]
    },
    env: { node: true, es2021: true },
    ignorePatterns: ["dist/", "node_modules/", "bruno_test_suite/"]
};
