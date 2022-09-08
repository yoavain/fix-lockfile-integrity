import traverse from "traverse";
import pLimit from "p-limit";
import type { OptionsOfJSONResponseBody, Response as GotResponse } from "got";
import got from "got";
import fs from "fs";
import * as prettier from "prettier";
import { detectJsonStyle } from "./jsonUtils";
import { logger } from "./logger";

const MAX_CONCURRENT_PROMISES = 4;

// Prettier config
const prettierInitialConfig: prettier.Options = {
    parser: "json"
};

const REGISTRY = "https://registry.npmjs.org";
type NPMJS_METADATA_PARTIAL = { versions: Array<Record<string, { dist: { integrity: string } }>> }

type IntegrityPair = {
    oldIntegrity: string
    newIntegrity: string
}

const getIntegrity = async (packageName: string, packageVersion: string, oldIntegrity: string): Promise<IntegrityPair | undefined> => {
    const url: string = `${REGISTRY}/${packageName}`;
    const options: OptionsOfJSONResponseBody = {
        responseType: "json",
        throwHttpErrors: false,
        headers: {
            Accept: "application/vnd.npm.install-v1+json"
        }
    };
    const metadata: GotResponse<NPMJS_METADATA_PARTIAL> = await got.get<NPMJS_METADATA_PARTIAL>(url, options);

    const newIntegrity: string = metadata?.body?.versions?.[packageVersion]?.dist?.integrity;

    return { oldIntegrity, newIntegrity };
};


export const fixLockFile = async (lockFileLocation: string): Promise<void> => {
    let dirtyCount: number = 0;

    // Read lock file
    let jsonString: string;
    try {
        jsonString = fs.readFileSync(lockFileLocation, "utf8");
    }
    catch (e) {
        logger.warn("Lock file does not exist");
        return;
    }

    if (typeof jsonString !== "string" || jsonString.length === 0) {
        logger.warn(`${lockFileLocation} is empty`);
        return;
    }

    // Identify indentation and EOL
    const jsonStyleOptions: prettier.Options = detectJsonStyle(jsonString);

    // Parse lock file
    let lockFile;
    try {
        lockFile = JSON.parse(jsonString);
    }
    catch (e) {
        logger.warn("Cannot parse JSON");
    }

    // Collect
    const limit = pLimit(MAX_CONCURRENT_PROMISES);
    let promises: Array<Promise<IntegrityPair>> = [];
    traverse(lockFile).forEach(function(node) {
        if (node && node.version && node.resolved?.startsWith(REGISTRY) && node.integrity?.startsWith("sha1-")) {
            const packageName = this.key;
            const packageVersion = node.version;
            const oldIntegrity = node.integrity;

            promises.push(limit(() => getIntegrity(packageName, packageVersion, oldIntegrity)));
        }
    });

    const integrityPairs: Array<IntegrityPair> = await Promise.all(promises);
    const integrityPairsMap = integrityPairs.reduce((acc, pair) => {
        acc[pair.oldIntegrity] = pair.newIntegrity;
        return acc;
    }, {});

    // Replace
    const fixedLockFile = traverse(lockFile).map(function(node) {
        if (node && node.version && node.integrity && integrityPairsMap[node.integrity]) {
            node.integrity = integrityPairsMap[node.integrity];
            ++dirtyCount;
        }
    });

    if (dirtyCount) {
        let lockFileString: string = JSON.stringify(fixedLockFile);
        if (prettierInitialConfig) {
            lockFileString = prettier.format(lockFileString, { ...prettierInitialConfig, ...jsonStyleOptions });
        }

        fs.writeFileSync(lockFileLocation, lockFileString, "utf8");
        logger.info(`Overwriting lock file with ${dirtyCount} integrity fixes`);
    }
    else {
        logger.info("No change needed for lock file");
    }
};
