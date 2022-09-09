import type { LoaderSync } from "cosmiconfig";
import { cosmiconfig, defaultLoaders } from "cosmiconfig";
import { TypeScriptLoader } from "cosmiconfig-typescript-loader";
import type { CosmiconfigResult } from "cosmiconfig/dist/types";
import path from "path";
import type { FixLockFileIntegrityConfig } from "./types";
import { defaultFixLockFileIntegrityConfig, defaultPrettierOptions } from "./consts";
import { logger } from "./logger";
import chalk from "chalk";

const MODULE_NAME = "fix-lockfile";

const customDefaultLoader = (ext: string): LoaderSync => {
    return (filepath: string, content: string) => {
        logger.verbose(`Reading configuration from ${chalk.magenta(filepath)}`);
        return defaultLoaders[ext](filepath, content);
    }; 
};

const customTsLoader: LoaderSync = (filepath: string, content: string) => {
    logger.verbose(`Reading configuration from ${chalk.magenta(filepath)}`);
    return TypeScriptLoader()(filepath, content);
};

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
        ".js": customDefaultLoader(".js"),
        ".json": customDefaultLoader(".json"),
        ".yaml": customDefaultLoader(".yaml"),
        ".yml": customDefaultLoader(".yml"),
        ".ts": customTsLoader
    }
});

export const getConfig = async (overrideConfigPath?: string): Promise<FixLockFileIntegrityConfig> => {
    let cosmiconfigResult: CosmiconfigResult;
    if (overrideConfigPath) {
        logger.verbose(`Reading configuration from ${chalk.magenta(overrideConfigPath)}`);
        cosmiconfigResult = await explorer.load(overrideConfigPath);
    }
    else {
        logger.verbose("Searching for configuration");
        cosmiconfigResult = await explorer.search(path.resolve(__dirname, ".."));
    }
    if (cosmiconfigResult?.config) {
        logger.verbose(`Configuration read:\n${chalk.magentaBright(JSON.stringify(cosmiconfigResult.config, null, 2))}`);
    }
    const prettierConfig = { ...defaultPrettierOptions, ...(cosmiconfigResult?.config as FixLockFileIntegrityConfig)?.prettier };
    return { ...defaultFixLockFileIntegrityConfig, ...cosmiconfigResult?.config as FixLockFileIntegrityConfig, prettier: prettierConfig };
};
