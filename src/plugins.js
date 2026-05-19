import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { envName } from "./constants";

const require = createRequire(import.meta.url);

// Plugin specific task events
const tasks = {
    // Allows access to regular log output
    axeReportLog(message) {
        /* eslint-disable-next-line no-console -- expected to log */
        console.log(message);
        return null;
    },
    axeGetInjectorSource() {
        const scriptPath = require.resolve("axe-core/axe.min.js");
        return fs.readFileSync(scriptPath, "utf8");
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
    const mjsPath = path.join(process.cwd(), "fk-cypress-axe.mjs");

    if (fs.existsSync(mjsPath)) {
        /* eslint-disable-next-line import/no-dynamic-require -- path is constructed from cwd */
        const mjsModule = require(mjsPath);
        config.env[envName] = JSON.stringify(mjsModule.default ?? mjsModule);
    }

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
