/// <reference types="cypress" />

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Fetches the current Axe configuration
             *
             * ```ts
             * cy.getAxeConfigThisFile().then((cfg) => {
             *   console.log(cfg);
             * });
             * ```
             *
             * @returns Chainable\<config\>
             */
            getAxeConfigThisFile(): Chainable<object>;

            /**
             * Stores a new Axe configuration.
             *
             * ```ts
             * const newCfg: { ...currentConfig, ignoreAxeFailures: true };
             * cy.setAxeConfigThisFile(newCfg);
             * ```
             *
             * @param config - The new configuration to be stored.
             */
            setAxeConfigThisFile(config: object): Chainable<void>;

            /**
             * Will ignore Axe failures
             *
             * ```ts
             * before(() => {
             *   cy.disableAxeFailures();
             * });
             * ```
             */
            disableAxeFailures(): Chainable<void>;

            /**
             * Listen to Axe failures, enabled by default, only needed if disabled.
             *
             * ```ts
             * after(() => {
             *   cy.enableAxeFailures();
             * });
             * ```
             *
             */
            enableAxeFailures(): Chainable<void>;

            /**
             * Execute axe to validate current view at a specific point in time.
             *
             * ```ts
             * it("my axe test", () => {
             *   cy.visit("/");
             *   cy.axe();
             * });
             * ```
             *
             */
            axe(): Chainable<void>;
        }
    }
}

declare const empty = ""; // Added since it need to be a module

export { empty };
