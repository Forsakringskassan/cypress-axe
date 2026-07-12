import fs from "node:fs/promises";
import cypress from "cypress";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TMP_DIR = "./temp/cypress-e2e";
const DEFAULT_CYPRESS_TIMEOUT = 60_000;

vi.setConfig({ testTimeout: DEFAULT_CYPRESS_TIMEOUT });

beforeEach(async () => {
    await fs.mkdir(TMP_DIR, { recursive: true });

    await fs.copyFile("cypress.config.ts", `${TMP_DIR}/cypress.config.ts`);
    await fs.cp("cypress", `${TMP_DIR}/cypress`, { recursive: true });
});

afterEach(async () => {
    await fs.rm(TMP_DIR, { recursive: true, force: true });
});

async function generateCypressConfig(
    fkAxeJson: Record<string, unknown>,
): Promise<void> {
    const cypressConfigFile = `

import { defineConfig } from "cypress";
import { init as installAxe } from "@forsakringskassan/cypress-axe/plugins";

const PORT: number = Number.parseInt(
    process.env.FK_AXE_SERVER_PORT ?? "8080",
    10,
);

export default defineConfig({
    allowCypressEnv: false,

    e2e: {
        baseUrl: \`http://localhost:\${PORT}\`,
        setupNodeEvents(on, config) {
            return installAxe(on, config, ${JSON.stringify(fkAxeJson)});
        },
    },
});
        `;

    await fs.writeFile(`${TMP_DIR}/cypress.config.ts`, cypressConfigFile);
}

async function runCypressSpec(
    specFile: string,
): Promise<CypressCommandLine.CypressRunResult> {
    const result = await cypress.run({
        spec: `**/*/${specFile}`,
        headless: true,
        project: TMP_DIR,
    });

    if ("status" in result) {
        throw new Error(`Cypress failed to start: ${result.message}`);
    }
    return result;
}

describe("Configuration with JSON file", () => {
    it("should pass since we only check a valid block", async () => {
        const fkAxeJson = {
            context: {
                include: [[".valid-block"]],
            },
        };

        await fs.writeFile(
            `${TMP_DIR}/fk-cypress-axe.json`,
            JSON.stringify(fkAxeJson, null, 2),
        );

        const result = await runCypressSpec("cypress/e2e/invalid-block.cy.ts");
        expect(result.totalFailed).toBe(0);
    });

    it("should fail since we check a invalid block", async () => {
        const fkAxeJson = {
            context: {
                include: [[".invalid-block"]],
            },
        };

        await fs.writeFile(
            `${TMP_DIR}/fk-cypress-axe.json`,
            JSON.stringify(fkAxeJson, null, 2),
        );

        const result = await runCypressSpec("cypress/e2e/invalid-block.cy.ts");
        expect(result.totalFailed).toBe(1);
    });
});

describe("Configuration in cypress.config", () => {
    it("should pass since we only check a valid block", async () => {
        const fkAxeJson = {
            context: {
                include: [[".valid-block"]],
            },
        };

        await generateCypressConfig(fkAxeJson);

        const result = await runCypressSpec("cypress/e2e/invalid-block.cy.ts");
        expect(result.totalFailed).toBe(0);
    });

    it("should fail since we check a invalid block", async () => {
        const fkAxeJson = {
            context: {
                include: [[".invalid-block"]],
            },
        };

        await generateCypressConfig(fkAxeJson);

        const result = await runCypressSpec("cypress/e2e/invalid-block.cy.ts");
        expect(result.totalFailed).toBe(1);
    });
});

describe("Manually running using axe and cypress axe commands", () => {
    it("All sub tests should pass (tests itself is verifying that the markup is valid or not)", async () => {
        const result = await runCypressSpec("cypress/e2e/axe-command.cy.ts");
        expect(result.totalFailed).toBe(0);
        expect(result.totalTests).toBeGreaterThan(0);
    });
});
