describe("Valid Page Accessibility", () => {
    it("should pass with valid page", () => {
        cy.visit("/valid-page.html");
    });

    it("should pass using cy.axe() on a valid page", () => {
        cy.visit("/valid-page.html");
        cy.axe();
    });

    it("should not pass an invalid page", () => {
        let failing = 0;

        cy.on("fail", (err) => {
            expect(err.message).to.include("A11y problems were detected");
            failing = ++failing;
        });

        cy.on("test:after:run", () => {
            // Fail expected to be triggered once
            expect(failing, "Nbr of fails to be triggered").to.eq(1);
        });

        cy.visit("/invalid-page.html");
    });

    it("should not pass an invalid page using cy.axe()", () => {
        let failing = 0;

        cy.on("fail", (err) => {
            expect(err.message).to.include("A11y problems were detected");
            failing = ++failing;
        });

        cy.on("test:after:run", () => {
            // Fail expected to be triggered twice, in the test and afterEach
            expect(failing, "Nbr of fails to be triggered").to.eq(2);
        });

        cy.visit("/invalid-page.html");
        cy.axe();
    });

    it("should pass an invalid page when disabling axe failures", () => {
        cy.disableAxeFailures();
        cy.visit("/invalid-page.html");
    });

    it("should not pass an invalid page when enabling axe failures", () => {
        let failing = 0;

        cy.on("fail", (err) => {
            expect(err.message).to.include("A11y problems were detected");
            failing = ++failing;
        });

        cy.on("test:after:run", () => {
            // Fail expected to be triggered once
            expect(failing, "Nbr of fails to be triggered").to.eq(1);
        });

        cy.enableAxeFailures();
        cy.visit("/invalid-page.html");
    });
});
