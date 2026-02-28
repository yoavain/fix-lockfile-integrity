import type { LoaderSync, LilconfigResult } from "lilconfig";
import { lilconfig, defaultLoaders } from "lilconfig";
import TypeScriptLoader from "@sliphua/lilconfig-ts-loader";
import path from "path";
import type * as prettier from "prettier";
import type { FixLockFileIntegrityConfig } from "./types";
import { defaultFixLockFileIntegrityConfig, defaultPrettierOptions } from "./consts";
import { logger } from "./logger";
import pc from "picocolors";

const MODULE_NAME: string = "fix-lockfile";

const withLogging = (loader: LoaderSync): LoaderSync => (filepath, content) => {
    logger.verbose(`Reading configuration from ${pc.magenta(filepath)}`);
    return loader(filepath, content);
};

const customDefaultLoader = (ext: string): LoaderSync => withLogging(defaultLoaders[ext]);
const customTsLoader: LoaderSync = withLogging(TypeScriptLoader);

const explorer = lilconfig(MODULE_NAME, {
    searchPlaces: [
        `.${MODULE_NAME}.json`,
        `.${MODULE_NAME}.js`,
        `.${MODULE_NAME}.ts`,
        `${MODULE_NAME}.config.json`,
        `${MODULE_NAME}.config.js`,
        `${MODULE_NAME}.config.ts`
    ],
    loaders: {
        ".js": customDefaultLoader(".js"),
        ".json": customDefaultLoader(".json"),
        ".ts": customTsLoader
    }
});

export const getConfig = async (overrideConfigPath?: string): Promise<FixLockFileIntegrityConfig> => {
    let lilconfigResult: LilconfigResult;
    if (overrideConfigPath) {
        logger.verbose(`Reading configuration from ${pc.magenta(overrideConfigPath)}`);
        lilconfigResult = await explorer.load(overrideConfigPath);
    }
    else {
        logger.verbose("Searching for configuration");
        lilconfigResult = await explorer.search(path.resolve("./"));
    }
    if (lilconfigResult?.config) {
        logger.verbose(`Configuration read:\n${pc.magenta(JSON.stringify(lilconfigResult.config, null, 2))}`);
    }
    const prettierConfig: prettier.Options = {
        ...defaultPrettierOptions,
        ...(lilconfigResult?.config as FixLockFileIntegrityConfig)?.prettier
    };

    return {
        ...defaultFixLockFileIntegrityConfig,
        ...lilconfigResult?.config as FixLockFileIntegrityConfig,
        registries: (lilconfigResult?.config?.registries as string[])?.map((registry: string) => {
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
