import defaultConfig, { defineConfig } from "@forsakringskassan/eslint-config";
import cypressConfig from "@forsakringskassan/eslint-config-cypress";
import typescriptConfig from "@forsakringskassan/eslint-config-typescript";
import typeinfoConfig from "@forsakringskassan/eslint-config-typescript-typeinfo";

export default [
    defineConfig({
        name: "Ignored files",
        ignores: [
            "**/coverage/**",
            "**/dist/**",
            "**/node_modules/**",
            "**/temp/**",
        ],
    }),

    ...defaultConfig,

    cypressConfig({
        files: ["**/*.{js,ts}"],
    }),
    typescriptConfig(),
    typeinfoConfig(import.meta.dirname, {
        files: ["**/*.ts"],
        ignores: ["*.d.ts"],
    }),

    /* cypyress downgrades to 2019 */
    defineConfig({
        languageOptions: {
            ecmaVersion: 2024,
        },
    }),
];
