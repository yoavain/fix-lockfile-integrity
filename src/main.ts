import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import type { FixLockFileIntegrityConfig } from "./types";
import { getConfig } from "./config";
import { fixLockFile } from "./lockfix";
import path from "path";
import { logger, setQuiet, setVerbose } from "./logger";

type Command = {
    file: string
    config: string
}

export const main = async () => {
    const cliParams = await yargs(hideBin(process.argv))
        .command<Command>("* [file]", "fix file", (yargs) => {
            return yargs
                .positional("file", {
                    describe: "file to fix"
                });
        }, (argv) => {
        })
        .option("config", {
            alias: "c",
            type: "string",
            description: "configuration file"
        })
        .option("verbose", {
            type: "boolean",
            description: "verbose"
        })
        .option("quiet", {
            alias: "q",
            type: "boolean",
            description: "quiet"
        })
        .parse();

    if (cliParams.quiet) {
        setQuiet();
    }
    if (cliParams.verbose) {
        setVerbose();
    }

    // Read config
    const config: FixLockFileIntegrityConfig = await getConfig(cliParams.config);

    let lockFilesLocations =[];
    if (cliParams.file) {
        lockFilesLocations = [cliParams.config];
    }
    else {
        config.includeFiles?.forEach((file: string) => lockFilesLocations.push(file));
        config.includePaths?.forEach((includedPath: string) => {
            config.lockFileNames?.forEach((filename: string) => lockFilesLocations.push(path.resolve(includedPath, filename)));
        });
    }

    logger.info(`Handling ${lockFilesLocations.length} file${lockFilesLocations.length > 1 ? "s" : ""}`);
    for (let i = 0; i < lockFilesLocations.length; i++) {
        const lockFile = lockFilesLocations[i];
        logger.info(`Started handling ${lockFile} [${i+1}/${lockFilesLocations.length}]`);
        try {
            await fixLockFile(lockFile);
        }
        catch (e) {
            // do nothing
        }
        logger.info(`Finished handling ${lockFile} [${i+1}/${lockFilesLocations.length}]`);
    }
};

// Run main
main().catch(console.error);
