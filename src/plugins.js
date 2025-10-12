import fs from "fs";
import { createRequire } from "node:module";
import { envName } from "./constants";

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
        return fs.readFileSync(scriptPath, "utf-8");
    },
};

/**
 * @template T
 * @param {T} config
 * @returns {T}
 */
export function init(on, config) {
    // Registers plugin-specific task events
    on("task", tasks);

    // Load plugin configuration
    // [Workaround] Cannot store deep structures in config object => Store entire json file as environment variable
    try {
        const localConfig = fs.readFileSync("fk-cypress-axe.json").toString();
        config.env[envName] = localConfig;
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
