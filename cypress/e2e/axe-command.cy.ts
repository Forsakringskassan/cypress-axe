describe("Valid Page Accessibility", () => {
    it("passes", () => {
        cy.visit("/valid-page.html");
        cy.axe();
    });

    it("should not pass", () => {
        cy.on("fail", (err) => {
            expect(err.message).to.include("A11y problems were detected");
            return false;
        });

        cy.visit("/invalid-page.html");
        cy.axe();
    });
});
