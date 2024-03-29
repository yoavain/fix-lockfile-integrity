import traverse from "traverse";
import pLimit from "p-limit";
import type { OptionsOfJSONResponseBody, Response } from "got";
import got from "got";
import fs from "fs";
import * as prettier from "prettier";
import { detectJsonStyle } from "./jsonUtils";
import { logger } from "./logger";
import chalk from "chalk";
import { FixLockFileResult } from "./types";
import { isRegistrySupported } from "./registries";

const MAX_CONCURRENT_PROMISES: number = 4;
const MODE_MODULES_PREFIX: string = "node_modules/";

/**
 * Global cache: old hash -> new hash map
 */
const integrityPairsMap: Record<string, string> = {};

// Prettier config
const prettierInitialConfig: prettier.Options = {
    parser: "json",
    printWidth: 0 // to always have new lines
};

type NPMJS_METADATA_PARTIAL = { dist: { integrity: string } };

export const formHashApiUrl = (registry: URL, packageName: string, packageVersion: string) => {
    const integrityUrlPath: string = [packageName, packageVersion].join("/");
    return new URL(integrityUrlPath, registry);
};

/**
 * Fetches for sha512 integrity for a package version
 *
 * @param registry          registry
 * @param packageName       package name
 * @param packageVersion    package version
 */
export const getIntegrity = async (registry: URL, packageName: string, packageVersion: string): Promise<string> => {
    const url: URL = formHashApiUrl(registry, packageName, packageVersion);
    const options: OptionsOfJSONResponseBody = {
        responseType: "json",
        throwHttpErrors: false,
        headers: {
            Accept: "application/json"
        }
    };
    let metadata: Response<NPMJS_METADATA_PARTIAL>;
    try {
        metadata = await got.get<NPMJS_METADATA_PARTIAL>(url, options);
    }
    catch (error) {
        logger.warn(`${chalk.red("Error retrieving response from API:")} ${chalk.blue(url.toString())} - ${chalk.red(error.message)}`);
        return undefined;
    }

    if (metadata.statusCode < 200 || metadata.statusCode >= 300) {
        logger.warn(`${chalk.red("Received")} ${chalk.blue(metadata.statusCode)} ${chalk.red("response from API:")} ${chalk.blue(url.toString())}`);
        return undefined;
    }

    const integrity: string = metadata?.body?.dist?.integrity;
    if (!integrity?.startsWith("sha512")) {
        logger.warn(`${chalk.red("Unable to retrieve sha512 from API response:")} ${chalk.blue(url.toString())}`);
        return undefined;
    }
    return integrity;
};

const parsePackageName = (key: string): string => {
    const index: number = key.lastIndexOf(MODE_MODULES_PREFIX);
    return index >= 0 ? key.substring(index + MODE_MODULES_PREFIX.length) : key;
};

export const parseRegistryWithPath = (url: URL, packageName: string): URL => {
    const registryUrl: URL = new URL(url.href);
    registryUrl.pathname = registryUrl.pathname.substring(0, registryUrl.pathname.indexOf(`/${packageName}/`) + 1);
    return registryUrl;
};

export const fixLockFile = async (lockFileLocation: string): Promise<FixLockFileResult> => {
    let dirtyCount: number = 0;

    // Read lock file
    let jsonString: string;
    try {
        jsonString = await fs.promises.readFile(lockFileLocation, "utf8");
    }
    catch (e) {
        logger.warn(`${chalk.red("Lock file")} ${chalk.blue(lockFileLocation)} ${chalk.red("does not exist")}`);
        return FixLockFileResult.FILE_NOT_FOUND_ERROR;
    }

    if (typeof jsonString !== "string" || jsonString.length === 0) {
        logger.warn(`${chalk.blue(lockFileLocation)} ${chalk.red("is empty")}`);
        return FixLockFileResult.FILE_PARSE_ERROR;
    }

    // Identify indentation and EOL
    const jsonStyleOptions: prettier.Options = detectJsonStyle(jsonString);

    // Parse lock file
    let lockFile;
    try {
        lockFile = JSON.parse(jsonString);
    }
    catch (e) {
        logger.warn(chalk.red("Cannot parse JSON"));
        return FixLockFileResult.FILE_PARSE_ERROR;
    }

    // Collect
    const limit = pLimit(MAX_CONCURRENT_PROMISES);
    let promises: Array<Promise<void>> = [];
    let hashesFound: Set<string> = new Set<string>();
    traverse(lockFile).forEach(function(node) {
        let resolvedUrl: URL;
        try {
            resolvedUrl = new URL(node.resolved);
        }
        catch (e) {
            logger.warn(`${chalk.red("Resolved URL")} ${chalk.blue(node.resolved)} is not a valid URL`);
        }
        if (node && node.version && resolvedUrl && node.integrity?.startsWith("sha1-") && isRegistrySupported(resolvedUrl)) {
            const packageName: string = parsePackageName(this.key);
            const registry: URL = parseRegistryWithPath(resolvedUrl, packageName);
            const packageVersion: string = node.version;
            const oldIntegrity: string = node.integrity;

            if (!hashesFound.has(oldIntegrity)) {
                hashesFound.add(oldIntegrity);
                promises.push(limit(async () => {
                    const newIntegrity = await getIntegrity(registry, packageName, packageVersion);
                    if (newIntegrity) {
                        integrityPairsMap[oldIntegrity] = newIntegrity;
                    }
                }));
            }
        }
    });
    await Promise.all(promises);

    // Replace
    const fixedLockFile = traverse(lockFile).map(function(node) {
        if (node && node.version && node.integrity && integrityPairsMap[node.integrity]) {
            node.integrity = integrityPairsMap[node.integrity];
            ++dirtyCount;
        }
    });

    if (dirtyCount) {
        try {
            const lockFileString: string = prettier.format(JSON.stringify(fixedLockFile, null, 2), { ...prettierInitialConfig, ...jsonStyleOptions });
            await fs.promises.writeFile(lockFileLocation, lockFileString, "utf8");
        }
        catch (e) {
            logger.error(`${chalk.red("Unable to write lock file")} ${chalk.blue(lockFileLocation)}: ${chalk.red(e.message)}`);
            return FixLockFileResult.FILE_WRITE_ERROR;
        }
        logger.info(`${chalk.green("Overwriting lock file")} ${chalk.blue(lockFileLocation)} with ${chalk.red(dirtyCount)} integrity ${dirtyCount > 1 ? "fixes" : "fix"}`);
        return FixLockFileResult.FILE_FIXED;
    }
    else {
        logger.info(`${chalk.green("No change needed for lock file")} ${chalk.blue(lockFileLocation)}`);
        return FixLockFileResult.FILE_NOT_CHANGED;
    }
};
