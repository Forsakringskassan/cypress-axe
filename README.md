# @forsakringskassan/cypress-axe

Ett cypress plugin för att automatiskt köra axe tester.

Plugin:et placerar och utför valideringskontroller för tillgänglighet i slutet av varje cypress test.

## Installation / Användning

Plugin:et placerar automatiskt diverse valideringscheckar efter varje cypress mha. ett vanligt `afterEach` block i Cypress.
För att injicera samt konfigurera plugin:et på rätt sätt krävs att man lägger till följande kodstycken i sin `support/index.js` samt `plugins/index.js`.

Om man har `cypress-axe` sen tidigare tar man bort det, kolla i:

- `package.json`
- `support/index.js`
- `plugins/index.js`

### support/index.js

Lägg till följande någonstans i filen

```javascript
import "fk-cypress-axe/support";
```

### plugins/index.js

Lägg till följande i toppen av filen

```javascript
const fkcyaxe = require("fk-cypress-axe/plugins");
```

Om det inte redan finns en `module.exports = (on, config) => { ... }` pilfunktion, lägg då till denna.
Notera att både `on` och `config` behövs.

```javascript
config = fkcyaxe.init(on, config);
```

Ovanstående rad modifierar cypress konfigurationen, därför är det sedan också viktigt att pilfunktionen returnerar det slutgiltiga `config` objektet

```javascript
return config;
```

Filen kan exempelvis då se ut som följande:

```javascript
const fkcyaxe = require("fk-cypress-axe/plugins");

module.exports = (on, config) => {
    // ...

    config = fkcyaxe.init(on, config);

    // ...

    return config;
};
```

## Konfiguration

Konfigurationen av plugin:et görs i `fk-cypress-axe.{mjs,json}` i root-katalogen.

Basinställningarna ser ut som följande:

```javascript
{
  "axe": {
    "rules": [
      // Disable color contrast rule
      {
        "id": 'color-contrast',
        "enabled": false,
      },
    ],
  },
  "context": null,
  "assertOnViolation": true, // Stoppar resterande tester så fort ett misslyckas. (Annars rapporteras även felaktiga testfall som lyckade).
  "displayHelpUrl": true, // Visar aXe help URL tillsammans med felet. Default true.
  "displayContext": true, // Visar sammanhang (CSS selector, HTML, Förslag till rättelse, osv.)
  "displayPasses": true, // Visar även passes. Default true
  "displayViolations": true, // Visar felen. Default true.
  "standardsToReport": ['wcag2a', 'wcag2aa'], // Lista med standarder som kontrolleras. Om listan är tom visas valideras samtliga standarder.
  "ignoreAxeFailures": false, // Ignorera Axe-valideringsfel. Default false
  "displayWhen": 'both', // När felen ska visas ("immediate", "end", "both")
  "excludeSelectorsList": [], // Lista med eventuella CSS selectorer som ska undantas från tillgänglighetskontrollerna
}
```

Genom att fylla i en lokal `fk-cypress-axe.json` kan man alltså skriva över enskilda inställningar i denna filen.
Resterande fält diff:as mot basinställningarna.

**OBS:** Vissa inställningar diff:as ej, nämligen inställningarna som finns i `axe.rules`.
Dvs. om man i sin lokala konfiguration ändrar `'color-contrast'` regeln på något sätt så kommer enabled att återställas till true, även om man själv inte ändrat just `enabled`.

### `include` / `exclude`

Utöver `excludeSelectorsList` kan man använda `context` för att ange vad som ska inkluderas och exkluderas.
Detta påverkar vilka element som axe kör på iställer för filtrering i efterhand.

`fk-cypress-axe.json`:

```json
{
    "context": {
        "include": [["#app"]],
        "exclude": [[".selector1"], [".selector2"], ["..."]]
    }
}
```

### Filspecifik konfiguration

Det är möjligt att ändra konfigurationen för en enskild fil.
Dessa ändringar kommer alltså inte att sprida sig till övriga `.spec` filer.
Detta görs genom att tidigt i spec filen lägga till följande kodstycke.

```javascript
before(() => {
    // Retrieves the current configuration used by fk-cypress-axe.
    cy.getAxeConfigThisFile().then((config) => {
        // Make your changes here, for example, the following is a valid change
        config.excludeSelectorsList = [".secret-menu"];

        // Don't forget to pass your changed config back to cypress
        cy.setAxeConfigThisFile(config);
    });
});
```

Det är för tillfället **inte** möjligt att ändra konfigurationen för enskilda testfall.
Ovanstående stycke kommer att påverka hela `.spec` filen fr.o.m då det körs.
Det finns därför ingen mening med att placera det på annan plats än i det yttersta scope:t.
