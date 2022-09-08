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
        .scriptName("fix-lockfile-integrity")
        .command<Command>("* [file]", "fix file", (yargs) => {
            return yargs
                .positional("file", {
                    describe: "file to fix (default: looks for package-lock.json/npm-shrinkwrap.json in running folder"
                });
        }, (argv) => {
        })
        .option("config", {
            alias: "c",
            type: "string",
            description: "configuration file"
        })
        .option("verbose", {
            alias: "v",
            type: "boolean",
            description: "verbose logging"
        })
        .option("quiet", {
            alias: "q",
            type: "boolean",
            description: "quiet (suppresses verbose too)"
        })
        .help("h")
        .alias("h", "help")
        .parse();

    if (cliParams.quiet) {
        setQuiet();
    }
    else if (cliParams.verbose) {
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

    for (let i = 0; i < lockFilesLocations.length; i++) {
        const lockFile = lockFilesLocations[i];
        logger.info(`Started handling ${lockFile}`);
        try {
            await fixLockFile(lockFile);
        }
        catch (e) {
            // do nothing
        }
        logger.info(`Finished handling ${lockFile}`);
        if (i < lockFilesLocations.length - 1) {
            logger.info("-------------------------------------------------------------------------");
        }
    }
};

// Run main
main().catch(console.error);
