import traverse from "traverse";
import pLimit from "p-limit";
import type { OptionsOfJSONResponseBody, Response as GotResponse } from "got";
import got from "got";
import fs from "fs";
import * as prettier from "prettier";
import { detectJsonStyle } from "./jsonUtils";
import { logger } from "./logger";
import chalk from "chalk";
import { FixLockFileResult } from "./types";

const MAX_CONCURRENT_PROMISES = 4;
const MODE_MODULES_PREFIX = "node_modules/";

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

/**
 * Fetches for sha512 integrity for a package version
 *
 * @param packageName       package name
 * @param packageVersion    package version
 */
const getIntegrity = async (registry: string, packageName: string, packageVersion: string): Promise<string> => {
    const url: string = `${registry}/${packageName}/${packageVersion}`;
    const options: OptionsOfJSONResponseBody = {
        responseType: "json",
        throwHttpErrors: false,
        headers: {
            Accept: "application/json"
        }
    };
    const metadata: GotResponse<NPMJS_METADATA_PARTIAL> = await got.get<NPMJS_METADATA_PARTIAL>(url, options);

    const integrity: string = metadata?.body?.dist?.integrity;
    return integrity?.startsWith("sha512") ? integrity : undefined;
};

const parsePackageName = (key: string): string => {
    const index: number = key.lastIndexOf(MODE_MODULES_PREFIX);
    return index >=0 ? key.substring(index + MODE_MODULES_PREFIX.length) : key;
};

export const fixLockFile = async (lockFileLocation: string): Promise<FixLockFileResult> => {
    let dirtyCount: number = 0;

    // Read lock file
    let jsonString: string;
    try {
        jsonString = fs.readFileSync(lockFileLocation, "utf8");
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
        if (node && node.version && node.resolved && new URL(node.resolved)?.host && node.integrity?.startsWith("sha1-")) {
            const packageName = parsePackageName(this.key);
            const registry = node.resolved.substring(0, node.resolved.indexOf(packageName));
            const packageVersion = node.version;
            const oldIntegrity = node.integrity;

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
            fs.writeFileSync(lockFileLocation, lockFileString, "utf8");
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
