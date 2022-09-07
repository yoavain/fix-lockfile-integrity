import { cosmiconfig } from "cosmiconfig";
import { TypeScriptLoader } from "cosmiconfig-typescript-loader";
import type { CosmiconfigResult } from "cosmiconfig/dist/types";
import path from "path";
import type { FixLockFileIntegrityConfig } from "./types";
import { defaultFixLockFileIntegrityConfig, defaultPrettierOptions } from "./consts";

const MODULE_NAME = "fix-lockfile";

const explorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: [
        `.${MODULE_NAME}.json`,
        `.${MODULE_NAME}.yaml`,
        `.${MODULE_NAME}.yml`,
        `.${MODULE_NAME}.js`,
        `.${MODULE_NAME}.ts`,
        `${MODULE_NAME}.config.json`,
        `${MODULE_NAME}.config.js`,
        `${MODULE_NAME}.config.ts`
    ],
    loaders: {
        ".ts": TypeScriptLoader()
    }
});

export const getConfig = async (overrideConfigPath?: string): Promise<FixLockFileIntegrityConfig> => {
    const cosmiconfigResult: CosmiconfigResult = overrideConfigPath ? await explorer.load(overrideConfigPath) : await explorer.search(path.resolve(__dirname, ".."));
    const prettierConfig = { ...defaultPrettierOptions, ...(cosmiconfigResult?.config as FixLockFileIntegrityConfig)?.prettier };
    return { ...defaultFixLockFileIntegrityConfig, ...cosmiconfigResult?.config as FixLockFileIntegrityConfig, prettier: prettierConfig };
};
