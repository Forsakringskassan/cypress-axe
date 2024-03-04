import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import dts from "rollup-plugin-dts";

function packageJsonWriter() {
    const type = {
        cjs: "commonjs",
        es: "module",
    };
    return {
        name: "package-json-writer",
        generateBundle(options) {
            const pkg = {
                type: type[options.format],
            };
            this.emitFile({
                type: "asset",
                fileName: "package.json",
                source: JSON.stringify(pkg, null, 2),
            });
        },
    };
}

function buildLib({ format }) {
    return {
        input: ["src/support.js", "src/plugins.js"],
        output: {
            dir: `dist/${format}`,
            format,
            exports: "named",
        },
        plugins: [
            typescript({
                outDir: `dist/${format}`,
                declaration: false,
                declarationMap: false,
                declarationDir: undefined,
            }),
            nodeResolve(),
            packageJsonWriter(),
        ],
    };
}

export default [
    buildLib({ format: "cjs" }),
    buildLib({ format: "esm" }),
    {
        input: ["temp/types/support.d.ts"],
        output: {
            file: "dist/types/support.d.ts",
            format: "esm",
        },
        preserveEntrySignatures: "strict",
        plugins: [dts()],
    },
    {
        input: ["temp/types/plugins.d.ts"],
        output: {
            file: "dist/types/plugins.d.ts",
            format: "esm",
        },
        preserveEntrySignatures: "strict",
        plugins: [dts()],
    },
];
