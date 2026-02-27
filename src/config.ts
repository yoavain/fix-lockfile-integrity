import type { LoaderSync } from "cosmiconfig";
import { cosmiconfig, defaultLoaders } from "cosmiconfig";
import { TypeScriptLoader } from "cosmiconfig-typescript-loader";
import type { CosmiconfigResult } from "cosmiconfig/dist/types";
import path from "path";
import type * as prettier from "prettier";
import type { FixLockFileIntegrityConfig } from "./types";
import { defaultFixLockFileIntegrityConfig, defaultPrettierOptions } from "./consts";
import { logger } from "./logger";
import pc from "picocolors";

const MODULE_NAME: string = "fix-lockfile";

const customDefaultLoader = (ext: string): LoaderSync => {
    return (filepath: string, content: string) => {
        logger.verbose(`Reading configuration from ${pc.magenta(filepath)}`);
        return defaultLoaders[ext](filepath, content);
    }; 
};

const customTsLoader: LoaderSync = (filepath: string, content: string) => {
    logger.verbose(`Reading configuration from ${pc.magenta(filepath)}`);
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
        `${MODULE_NAME}.config.yaml`,
        `${MODULE_NAME}.config.yml`,
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
        logger.verbose(`Reading configuration from ${pc.magenta(overrideConfigPath)}`);
        cosmiconfigResult = await explorer.load(overrideConfigPath);
    }
    else {
        logger.verbose("Searching for configuration");
        cosmiconfigResult = await explorer.search(path.resolve("./"));
    }
    if (cosmiconfigResult?.config) {
        logger.verbose(`Configuration read:\n${pc.magenta(JSON.stringify(cosmiconfigResult.config, null, 2))}`);
    }
    const prettierConfig: prettier.Options = {
        ...defaultPrettierOptions,
        ...(cosmiconfigResult?.config as FixLockFileIntegrityConfig)?.prettier
    };

    return {
        ...defaultFixLockFileIntegrityConfig,
        ...cosmiconfigResult?.config as FixLockFileIntegrityConfig,
        registries: (cosmiconfigResult?.config?.registries as string[])?.map((registry: string) => {
            try {
                // Assume it is a URL
                return new URL(registry);
            }
            catch (e) {
                try {
                    // Assume it is a hostname
                    return new URL(`https://${registry}`);
                }
                catch (e) {
                    logger.warn(`Invalid registry URL in configuration: ${pc.red(registry)}`);
                }
            }
        }).filter(Boolean),
        prettier: prettierConfig
    };
};
