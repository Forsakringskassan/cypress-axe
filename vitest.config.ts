import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globalSetup: ["./vitest.global.ts"],
    },
    server: {
        watch: {
            ignored: ["**/node_modules/**", "**/temp/**"],
        },
    },
});
