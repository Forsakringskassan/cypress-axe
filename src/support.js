import { envName } from "./constants";
import { defaultConfig } from "./config";

const Attribute = {
    ColorCodes: {
        red: "\x1b[31m",
        grey: "\x1b[37m",
        white: "\x1b[37;1m",
        normalColor: "\x1b[39m",
        indent: "",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        resetColor: "\x1b[0m",
        bold: "\x1b[1m",
        underline: "\x1b[4m",
        reversed: "\x1b[7m",
    },

    red(message) {
        return `${this.ColorCodes.red}${message}${this.ColorCodes.resetColor}`;
    },
    grey(message) {
        return `${this.ColorCodes.grey}${message}${this.ColorCodes.resetColor}`;
    },
    white(message) {
        return `${this.ColorCodes.white}${message}${this.ColorCodes.resetColor}`;
    },
    green(message) {
        return `${this.ColorCodes.green}${message}${this.ColorCodes.resetColor}`;
    },
    yellow(message) {
        return `${this.ColorCodes.yellow}${message}${this.ColorCodes.resetColor}`;
    },
    magenta(message) {
        return `${this.ColorCodes.magenta}${message}${this.ColorCodes.resetColor}`;
    },
    cyan(message) {
        return `${this.ColorCodes.cyan}${message}${this.ColorCodes.resetColor}`;
    },
    bold(message) {
        return `${this.ColorCodes.bold}${message}${this.ColorCodes.resetColor}`;
    },
    underline(message) {
        return `${this.ColorCodes.underline}${message}${this.ColorCodes.resetColor}`;
    },
    reversed(message) {
        return `${this.ColorCodes.reversed}${message}${this.ColorCodes.resetColor}`;
    },
};

// Used to create the summary
const globalResults = {
    passes: { enabled: [], disabled: [] },
    violations: { enabled: [], disabled: [] },
};

// Uses Cypress' task events to access the external Node log, allowing the plugin to print
// arbitrary text to the console
function nodeLog(message) {
    cy.task("axeReportLog", message, { log: false });
}

/**
 * @returns {Cypress.Chainable<string>}
 */
function getInjectorSource() {
    return cy.task("axeGetInjectorSource", null, { log: false });
}

// Informs the user of any potential problems with the user-provided configuration
// disabled lint motivation: too small/insignificant to divide
function validateConfig(config) {
    const errors = [];

    // Report fields that are not present in the default
    for (const [key] of Object.entries(config)) {
        if (typeof defaultConfig[key] === "undefined") {
            errors.push(
                `- The field "${key}" is not a valid configuration option.`,
            );
        }
    }

    // Report invalid values for displayWhen
    if (
        config.displayWhen !== "immediate" &&
        config.displayWhen !== "end" &&
        config.displayWhen !== "both"
    ) {
        errors.push(
            `- "displayWhen" can only be set to "immediate", "end", or "both" (was: ${config.displayWhen}).`,
        );
    }

    // Print all accumulated config errors
    if (errors.length) {
        nodeLog(
            Attribute.reversed(
                Attribute.red(`Invalid fk-cypress-axe configuration!`),
            ),
        );
        errors.forEach((error) => {
            nodeLog(Attribute.red(error));
        });
        nodeLog(
            Attribute.red(
                `As a result, some tests may be omitted or displayed when they shouldn't be!`,
            ),
        );
    }
}

// Retrieves the local configuration (diffed (selectively) against the default).
function getConfig() {
    const localConfig = Cypress.env(envName);
    if (!localConfig) {
        return defaultConfig;
    }

    const parsedConfig = JSON.parse(localConfig);
    const finalConfig = { ...defaultConfig, ...parsedConfig };

    if (parsedConfig.axe) {
        finalConfig.axe = {
            ...defaultConfig.axe,
            ...parsedConfig.axe,
        };

        if (parsedConfig.axe.rules) {
            finalConfig.axe.rules = [
                ...defaultConfig.axe.rules.filter((defaultRule) => {
                    return !parsedConfig.axe.rules.some((parsedRule) => {
                        return parsedRule.id === defaultRule.id;
                    });
                }),
                ...parsedConfig.axe.rules,
            ];
        }
    }

    validateConfig(finalConfig);

    return finalConfig;
}

// Adds axe to the currently active page.
// Must be called after cy.visit.
function prepareAxe() {
    getInjectorSource().then((source) =>
        cy.window({ log: false }).then((window) => {
            window.eval(source);

            if (!window.axe) {
                nodeLog(
                    Attribute.red(
                        Attribute.reversed("AXE COULD NOT BE LOADED"),
                    ) +
                        Attribute.red(
                            "\nAxe was likely injected before cy.visit or incorrectly processed",
                        ),
                );
            }
        }),
    );
}

// Returns two arrays of results based on whether they match the given standard tags
function filterResultsByStandardTags(results, standardTags) {
    const filteredResults = {
        enabled: [],
        disabled: [],
    };

    // When given an empty list, enable all standards
    if (standardTags.length === 0) {
        filteredResults.enabled = results;
        return filteredResults;
    }

    // Returns true if tag matches any of the given standard tags
    const isStandardTag = (tag) => {
        return standardTags.some((standardTag) => {
            return tag === standardTag;
        });
    };

    filteredResults.enabled = results.filter((result) => {
        return result.tags.some(isStandardTag);
    });

    filteredResults.disabled = results.filter((result) => {
        return !result.tags.some(isStandardTag);
    });

    return filteredResults;
}

// Returns two arrays of results based on whether they match the given rules
function filterResultsByExcludedSelectors(results, excludedSelectors) {
    const filteredResults = {
        enabled: [],
        disabled: [],
    };

    // Returns true if selector matches any of the excluded selectors
    const isExcluded = (selector) => {
        return excludedSelectors.some((excludedSelector) => {
            return selector === excludedSelector;
        });
    };

    filteredResults.enabled = results.filter((result) => {
        return result.nodes.some((node) => {
            return !node.target.some(isExcluded);
        });
    });

    filteredResults.disabled = results.filter((result) => {
        return result.nodes.some((node) => {
            return node.target.some(isExcluded);
        });
    });

    return filteredResults;
}

// Converts textual impact identifier to numerical value
function impactToPriority(impact) {
    switch (impact) {
        case "minor":
            return 3;
        case "moderate":
            return 2;
        case "serious":
            return 1;
        case "critical":
            return 0;
        default:
            return 4;
    }
}

function formatSuggestions(suggestions) {
    return suggestions.reduce((msg, line) => {
        return `${msg}\n\t\t\t\t\t* ${line.replace("\n", "").trim()}`;
    });
}

function formatHTML(html) {
    return html.reduce((msg, line) => {
        return `${msg}\n\t\t\t  ${line.replace("\n", "")}`;
    });
}

function formatTarget(target) {
    return target.reduce((msg, target) => {
        return `${msg} ${target}`;
    });
}

function formatTags(tags) {
    return tags.reduce((msg, tag) => {
        // Returns true if tag matches any of the given standard tags
        const isStandardTag = (tag) => {
            const config = getConfig();
            return config.standardsToReport.some((standardTag) => {
                return tag === standardTag;
            });
        };

        if (isStandardTag(tag)) {
            return `${msg}, ${Attribute.green(tag)}`;
        } else {
            return `${msg}, ${tag}`;
        }
    });
}

function printContextField(name, value, withBullet) {
    name = `${name}:`.padEnd(14);
    let bullet = ``;
    if (withBullet) {
        bullet = `*`;
    }
    nodeLog(`\t\t${bullet}\t${name}${value}`);
}

// Prints the context to a given violation, such as the CSS selector used to identify the element,
// the offending piece of html, suggestions for solutions to the problem,
// and a list of standards to which the problem is checked against.
function displayContext(violation, config) {
    cy.wrap(violation.nodes, { log: false }).each((node) => {
        // Remove redundant "Fix all/any of these:" prefix, and remove newlines.
        const context = {
            ["CSS Selector"]: formatTarget(node.target),
            ["HTML"]: formatHTML(node.html.split("\n")),
            ["Suggestions"]: formatSuggestions(node.failureSummary.split("\n")),
            ["Standards"]: formatTags(violation.tags),
        };

        let withBullet = true;
        for (const [key, value] of Object.entries(context)) {
            if (config.displayContext === true) {
                printContextField(key, value, withBullet);
                withBullet = false;
            }
        }

        const log = Cypress.log({
            name: `(${violation.impact}) ACCESSIBILITY VIOLATION`,
            consoleProps: () => context,
            message: `${violation.help}`,
        });

        // Append element to previous log. This causes the affected element to be highlighted.
        cy.get(context["CSS Selector"], { log: false }).then(($el) => {
            log.set({ $el }).snapshot().end();
        });
    });
}

// Prints a result as if it were a passing test.
function printPass(pass, config) {
    let messageTemplate = ` ${pass.help}`;
    if (config.displayHelpUrl) {
        messageTemplate += `\n\t\t${pass.helpUrl}`;
    }

    nodeLog(
        `\t${Attribute.green(Attribute.reversed(" PASS "))}${Attribute.green(
            messageTemplate,
        )}: [${pass.id}]`,
    );
}

// Prints a result as if it were a failing test.
function printViolation(violation, config) {
    const impactPriority = impactToPriority(violation.impact);
    let messageTemplate = ` (${violation.impact}) ${violation.help}`;
    if (config.displayHelpUrl) {
        messageTemplate += `\n\t\t${violation.helpUrl}`;
    }

    // Use color to hint at priority
    if (impactPriority <= 1) {
        nodeLog(
            `\t${Attribute.red(Attribute.reversed(" FAIL "))}${Attribute.red(
                messageTemplate,
            )}: [${violation.id}]`,
        );
    } else if (impactPriority <= 2) {
        nodeLog(
            `\t${Attribute.yellow(
                Attribute.reversed(` FAIL `),
            )}${Attribute.yellow(messageTemplate)}: [${violation.id}]`,
        );
    } else {
        nodeLog(
            `\t${Attribute.magenta(
                Attribute.reversed(` FAIL `),
            )}${Attribute.magenta(messageTemplate)}: [${violation.id}]`,
        );
    }
}

const impactComparator = (a, b) => {
    const aImpact = impactToPriority(a.impact);
    const bImpact = impactToPriority(b.impact);
    return Math.sign(aImpact - bImpact);
};

function processResults(results, config) {
    results.sort(impactComparator);
    const postPass1 = filterResultsByStandardTags(
        results,
        config.standardsToReport,
    );
    const postPass2 = filterResultsByExcludedSelectors(
        postPass1.enabled,
        config.excludeSelectorsList,
    );

    return {
        enabled: postPass2.enabled,
        disabled: [...postPass1.disabled, ...postPass2.disabled],

        disabledByStandardCount: postPass1.disabled.length,
        disabledBySelectorCount: postPass2.disabled.length,
    };
}

function displayPasses(passes, config) {
    if (!config.displayPasses || passes.enabled.length === 0) {
        return;
    }

    passes.enabled.forEach((pass) => {
        printPass(pass, config);
    });
}

function displayViolations(violations, config, withTitle) {
    if (!config.displayViolations || violations.enabled.length === 0) {
        return;
    }

    if (violations.enabled.length > 0) {
        if (withTitle) {
            const testName =
                Cypress.mocha.getRunner().suite.ctx.currentTest.title;
            nodeLog(
                Attribute.red(
                    `\t[${violations.enabled.length} Accessibility violation(s) were detected after `,
                ) +
                    Attribute.red(Attribute.underline(`"${testName}"`)) +
                    Attribute.red(`]`),
            );
        }

        violations.enabled.forEach((violation) => {
            printViolation(violation, config);
            if (config.displayContext) {
                displayContext(violation, config);
            }
        });
    } else {
        nodeLog(Attribute.green(`\tAll enabled tests passed!`));
    }
}

function displayNotices(violations, config) {
    if (!config.displayViolations) {
        return;
    }
    if (violations.disabledByStandardCount > 0) {
        nodeLog(
            Attribute.cyan(
                `Notice: ${violations.disabledByStandardCount} violation(s) were found outside of the enabled standards.`,
            ),
        );
    }
    if (violations.disabledBySelectorCount > 0) {
        nodeLog(
            Attribute.cyan(
                `Notice: ${violations.disabledBySelectorCount} violation(s) were found in excluded selectors.`,
            ),
        );
    }
}

/**
 * @returns {boolean}
 */
function anythingToDisplay(config, passes, violations) {
    const { displayPasses, displayViolations } = config;
    const numPasses = passes.enabled.length;
    const numViolations =
        violations.enabled.length +
        (violations.disabledByStandardCount || 0) +
        (violations.disabledBySelectorCount || 0);
    const anyPasses = displayPasses && numPasses > 0;
    const anyViolations = displayViolations && numViolations > 0;
    return anyPasses || anyViolations;
}

// The main function. Gets the most up to date configuration and runs all enabled Axe tests.
// Tests are either reported immediately or stored until later, depending on the configuration.
function runAxe() {
    Cypress.log({
        name: "fk-cypress-axe",
        displayName: "Axe",
        message: ["Running accessibility tests"],
    });
    const config = getConfig();

    if (config.ignoreAxeFailures === true) {
        return;
    }

    cy.window({ log: false })
        .then((window) => {
            window.axe.configure(config.axe);
            return window.axe.run(config.context || window.document);
        })
        .then(({ passes, violations }) => {
            passes = processResults(passes, config);
            violations = processResults(violations, config);

            const displayNow =
                config.displayWhen === "immediate" ||
                config.displayWhen === "both";

            globalResults.passes.enabled = globalResults.passes.enabled.concat(
                passes.enabled,
            );
            globalResults.passes.disabled =
                globalResults.passes.disabled.concat(passes.disabled);
            globalResults.violations.enabled =
                globalResults.violations.enabled.concat(violations.enabled);
            globalResults.violations.disabled =
                globalResults.violations.disabled.concat(violations.disabled);

            if (displayNow && anythingToDisplay(config, passes, violations)) {
                nodeLog("\tAccessibility results:");

                displayPasses(passes, config);
                displayViolations(violations, config, true);
                displayNotices(violations, config);

                // Empty line for clarity
                nodeLog("");
            }

            return cy.wrap(violations, { log: false });
        })
        .then((violations) => {
            if (config.assertOnViolation) {
                assert.equal(
                    violations.enabled.length,
                    0,
                    `${violations.enabled.length} A11y problems were detected`,
                    { log: false },
                );
            }
        });
}

// Removes duplicated results (based on help tag), as well as any duplicated nodes that appear when collapsing the results (based on html).
// Used to produce the summary at the end.
function removeDuplicates(results) {
    // Deep copy
    let finalResults = JSON.parse(JSON.stringify(results));

    // Gather all nodes under one result
    finalResults.forEach((result, index) => {
        const foundIndex = finalResults.findIndex((v) => {
            return v.help === result.help;
        });

        if (foundIndex !== index) {
            finalResults[foundIndex].nodes = finalResults[
                foundIndex
            ].nodes.concat(result.nodes);
            finalResults[index].toBeRemoved = true;
        }
    });

    // Remove duplicate results
    finalResults = finalResults.filter((result) => {
        return !result.toBeRemoved;
    });

    // Remove duplicate nodes
    finalResults.forEach((result) => {
        result.nodes.forEach((node, index) => {
            const foundIndex = result.nodes.findIndex((n) => {
                return n.html === node.html;
            });

            if (foundIndex !== index) {
                result.nodes[index].toBeRemoved = true;
            }
        });

        result.nodes = result.nodes.filter((n) => {
            return !n.toBeRemoved;
        });
    });

    return finalResults;
}

Cypress.Commands.add("getAxeConfigThisFile", () => {
    const config = getConfig();
    return cy.wrap(config);
});

Cypress.Commands.add("setAxeConfigThisFile", (userConfig) => {
    Cypress.env(envName, JSON.stringify(userConfig));
    return cy.wrap(userConfig);
});

afterEach(() => {
    prepareAxe();
    runAxe();
});

after(() => {
    const config = getConfig();

    const displayNow =
        config.displayWhen === "end" || config.displayWhen === "both";

    if (config.ignoreAxeFailures === false && displayNow) {
        globalResults.passes.enabled = removeDuplicates(
            globalResults.passes.enabled,
        );
        globalResults.passes.disabled = removeDuplicates(
            globalResults.passes.disabled,
        );
        globalResults.violations.enabled = removeDuplicates(
            globalResults.violations.enabled,
        );
        globalResults.violations.disabled = removeDuplicates(
            globalResults.violations.disabled,
        );

        // For the summary we want to only display passes that have never failed in any individual test.
        globalResults.passes.enabled = globalResults.passes.enabled.filter(
            (pass) => {
                return !globalResults.violations.enabled.some((violation) => {
                    return pass.id === violation.id;
                });
            },
        );

        const { passes, violations } = globalResults;
        if (anythingToDisplay(config, passes, violations)) {
            nodeLog(
                Attribute.reversed(
                    Attribute.yellow(
                        "---------------Accessibility Summary----------------",
                    ),
                ),
            );
            displayPasses(passes, config);
            displayViolations(violations, config, false);
        }
    }
});
