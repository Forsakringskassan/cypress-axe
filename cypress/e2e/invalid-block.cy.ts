describe("Invalid Block Accessibility", () => {
    it("fails if config includes invalid blocks", () => {
        cy.visit("/invalid-block.html");
    });
});
