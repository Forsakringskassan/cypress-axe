import cypress from "cypress";
import { describe, expect, it } from "vitest";

async function runCypressSpec(
    specFile: string,
): Promise<CypressCommandLine.CypressRunResult> {
    const result = await cypress.run({
        spec: specFile,
        headless: true,
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
    }, 60000);

    it("should fail the tests in invalidPage.spec.ts", async () => {
        const result = await runCypressSpec("cypress/e2e/invalid-page.cy.ts");
        expect(result.totalFailed).toBe(1);
        expect(result.totalTests).toBeGreaterThan(0);
    }, 60000);
});
