import type { ClioOptions, FixLockFileIntegrityConfig, FixLockFileResult } from "./types";
import { isError } from "./types";
import { getConfig } from "./config";
import { fixLockFile } from "./fixLockfileIntegrity";
import { logger, setQuiet, setVerbose } from "./logger";
import { parseCliOptions } from "./cli";
import { setRegistriesConfiguration } from "./registries";
import chalk from "chalk";
import path from "path";

export const main = async () => {
    const cliParams: ClioOptions = await parseCliOptions();
    if (cliParams.quiet) {
        setQuiet();
    }
    else if (cliParams.verbose) {
        setVerbose();
    }

    // Read config
    const config: FixLockFileIntegrityConfig = await getConfig(cliParams.config);

    // Set registries configuration
    setRegistriesConfiguration(config.allRegistries, config.registries);

    let explicitFilesLocations =[]; // must work
    let lookupPaths = []; // requires at least one file to work
    if (cliParams.file) {
        explicitFilesLocations = [cliParams.file];
    }
    else {
        config.includeFiles?.forEach((file: string) => explicitFilesLocations.push(file));
        config.includePaths?.forEach((includedPath: string) => lookupPaths.push(includedPath));
    }

    // Handle explicit files (throw on error)
    let lockFileIndex = 0;
    for (const lockFile of explicitFilesLocations) {
        logger.verbose(`Started handling ${chalk.blue(lockFile)}`);
        const fixLockFileResult: FixLockFileResult = await fixLockFile(lockFile);
        logger.verbose(`Finished handling ${chalk.blue(lockFile)}`);
        if (isError(fixLockFileResult)) {
            throw new Error(fixLockFileResult);
        }

        if (lockFileIndex < explicitFilesLocations.length - 1 || lookupPaths.length > 0) {
            logger.verbose(chalk.cyan("-------------------------------------------------------------------------"));
        }
        ++lockFileIndex;
    }
    
    // Handle lookup paths (throw if all file in path return an error)
    let lookupPathCounter = 0;
    for (const lookupPath of lookupPaths) {
        let anyFileHandled: boolean = false;
        for (const lockFileName of config.lockFileNames) {
            const lockFile: string = path.resolve(lookupPath, lockFileName);
            logger.verbose(`Started handling ${chalk.blue(lockFile)}`);
            const fixLockFileResult: FixLockFileResult = await fixLockFile(lockFile);
            logger.verbose(`Finished handling ${chalk.blue(lockFile)}`);
            if (!isError(fixLockFileResult)) {
                anyFileHandled = true;
            }
            if (lookupPathCounter < lookupPaths.length * config.lockFileNames.length - 1) {
                logger.verbose(chalk.cyan("-------------------------------------------------------------------------"));
            }
            ++lookupPathCounter;
        }
        if (!anyFileHandled) {
            throw new Error(`Failed to handle any lock file in ${lookupPath}`);
        }
    }
};
