import fs from "node:fs";
import { createRequire } from "node:module";

let localConfig = null;

// Plugin specific task events
const tasks = {
    // Allows access to regular log output
    axeReportLog(message) {
        /* eslint-disable-next-line no-console -- expected to log */
        console.log(message);
        return null;
    },
    axeGetInjectorSource() {
        const require = createRequire(import.meta.url);
        const scriptPath = require.resolve("axe-core/axe.min.js");
        return fs.readFileSync(scriptPath, "utf8");
    },
    getLocalConfig() {
        return localConfig;
    },
};

/**
 * @template T
 * @param {T} config
 * @param {any} userOptions
 * @returns {T}
 */
export function init(on, config, userOptions = undefined) {
    // Registers plugin-specific task events
    on("task", tasks);

    // Load plugin configuration
    if (userOptions !== undefined) {
        localConfig = userOptions;
        return config;
    }

    try {
        localConfig = JSON.parse(
            fs.readFileSync("fk-cypress-axe.json", {
                encoding: "utf8",
            }),
        );
    } catch {
        // ... No file found, use default configuration (handled in support)
    }

    return config;
}

/* used when default importing */
const compatibility = {
    init,
};

export default compatibility;
