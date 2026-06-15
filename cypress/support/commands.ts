declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace -- Required for Cypress type augmentation
    namespace Cypress {
        interface Chainable {
            axe(): void;
        }
    }
}

export {};
