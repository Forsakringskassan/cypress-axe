import fs from "node:fs/promises";
import cypress from "cypress";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TMP_DIR = "./temp/cypress-e2e";
const DEFAULT_CYPRESS_TIMEOUT = 60000;

vi.setConfig({ testTimeout: DEFAULT_CYPRESS_TIMEOUT });

beforeEach(async () => {
    await fs.mkdir(TMP_DIR, { recursive: true });

    await fs.copyFile("cypress.config.ts", `${TMP_DIR}/cypress.config.ts`);
    await fs.cp("cypress", `${TMP_DIR}/cypress`, { recursive: true });
});

afterEach(async () => {
    await fs.rm(TMP_DIR, { recursive: true, force: true });
});

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

describe("Cypress E2E Tester via Vitest", () => {
    it("should pass the tests in validPage.spec.ts", async () => {
        const result = await runCypressSpec("cypress/e2e/valid-page.cy.ts");
        expect(result.totalFailed).toBe(0);
        expect(result.totalTests).toBeGreaterThan(0);
    });

    it("should fail the tests in invalidPage.spec.ts", async () => {
        const result = await runCypressSpec("cypress/e2e/invalid-page.cy.ts");
        expect(result.totalFailed).toBe(1);
        expect(result.totalTests).toBeGreaterThan(0);
    });
});

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
