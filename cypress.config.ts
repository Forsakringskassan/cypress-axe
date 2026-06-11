import { defineConfig } from "cypress";
import { init as installAxe } from "@forsakringskassan/cypress-axe/plugins";

const PORT: number = Number.parseInt(
    process.env.FK_AXE_SERVER_PORT ?? "8080",
    10,
);

export default defineConfig({
    allowCypressEnv: false,

    e2e: {
        baseUrl: `http://localhost:${PORT}`,
        setupNodeEvents(on, config) {
            return installAxe(on, config);
        },
    },
});
