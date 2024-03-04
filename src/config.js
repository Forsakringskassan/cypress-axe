export const defaultConfig = {
    axe: {
        rules: [
            //Disable color contrast rule
            {
                id: "color-contrast",
                enabled: false,
            },
        ],
    },

    /**
     * Context object to pass to axe. If not set `window.document` is passed.
     *
     * Can be set to:
     *
     *   - CSS selector with root element.
     *   - An object `{include: string[][], exclude: string[][]}`
     *
     * Example:
     *
     * "context": {
     *   "include": [["#app"]],
     *   "exclude": [[".selector1"], [".selector2"]]
     * }
     *
     * See
     * https://www.deque.com/axe/axe-for-web/documentation/api-documentation/#context-parameter
     * for a longer description.
     */
    context: null,

    assertOnViolation: true, // Stoppar resterande tester så fort ett misslyckas. (Annars rapporteras även felaktiga testfall som lyckade).
    displayHelpUrl: true, // Visar aXe help URL tillsammans med felet. Default true.
    displayContext: true, // Visar sammanhang (CSS selector, HTML, Förslag till rättelse, osv.)
    displayPasses: false, // Visar även passes. Default false
    displayViolations: true, // Visar felen. Default true.
    standardsToReport: ["wcag2a", "wcag2aa"], // Lista med standarder som kontrolleras. Om listan är tom visas valideras samtliga standarder.
    ignoreAxeFailures: false, // Ignorera Axe-valideringsfel. Default false
    displayWhen: "both", // När felen ska visas ("immediate", "end", "both")
    excludeSelectorsList: [], // Lista med eventuella CSS selectorer som ska undantas från tillgänglighetskontrollerna
};
