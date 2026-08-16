import type { CliOptions, FixLockFileIntegrityConfig, FixLockFileResult } from "./types";
import { isError } from "./types";
import { getConfig } from "./config";
import { fixLockFile } from "./fixLockfileIntegrity";
import { logger, setQuiet, setVerbose } from "./logger";
import { parseCliOptions } from "./cli";
import { setRegistriesConfiguration } from "./registries";
import { getWorkspacePaths } from "./workspaces";
import pc from "picocolors";
import path from "path";

/**
 * Adds the workspace folders of the project to the lookup paths, without duplicates
 *
 * @param lookupPaths       paths from the configuration
 * @param lockFileNames     lock file names to look for
 */
const withWorkspacePaths = (lookupPaths: Array<string>, lockFileNames: Array<string>): Array<string> => {
    const rootDir: string = path.resolve("./");
    const mergedPaths: Array<string> = [...lookupPaths];
    for (const workspacePath of getWorkspacePaths(rootDir, lockFileNames)) {
        const isKnownPath: boolean = mergedPaths.some((lookupPath: string) => path.resolve(rootDir, lookupPath) === path.resolve(rootDir, workspacePath));
        if (!isKnownPath) {
            logger.verbose(`Detected workspace ${pc.blue(workspacePath)}`);
            mergedPaths.push(workspacePath);
        }
    }
    return mergedPaths;
};

export const main = async () => {
    const cliParams: CliOptions = parseCliOptions();
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

        if (config.includeWorkspaces !== false && !cliParams.disableWorkspaces) {
            lookupPaths = withWorkspacePaths(lookupPaths, config.lockFileNames);
        }
    }

    // Handle explicit files (throw on error)
    let lockFileIndex = 0;
    for (const lockFile of explicitFilesLocations) {
        logger.verbose(`Started handling ${pc.blue(lockFile)}`);
        const fixLockFileResult: FixLockFileResult = await fixLockFile(lockFile);
        logger.verbose(`Finished handling ${pc.blue(lockFile)}`);
        if (isError(fixLockFileResult)) {
            throw new Error(fixLockFileResult);
        }

        if (lockFileIndex < explicitFilesLocations.length - 1 || lookupPaths.length > 0) {
            logger.verbose(pc.cyan("-------------------------------------------------------------------------"));
        }
        ++lockFileIndex;
    }
    
    // Handle lookup paths (throw if all file in path return an error)
    for (const [i, lookupPath] of lookupPaths.entries()) {
        let anyFileHandled: boolean = false;
        for (const lockFileName of config.lockFileNames) {
            const lockFile: string = path.resolve(lookupPath, lockFileName);
            logger.verbose(`Started handling ${pc.blue(lockFile)}`);
            const fixLockFileResult: FixLockFileResult = await fixLockFile(lockFile);
            logger.verbose(`Finished handling ${pc.blue(lockFile)}`);
            if (!isError(fixLockFileResult)) {
                anyFileHandled = true;
            }
        }
        if (i < lookupPaths.length - 1) {
            logger.verbose(pc.cyan("-------------------------------------------------------------------------"));
        }
        if (!anyFileHandled) {
            throw new Error(`Failed to handle any lock file in ${lookupPath}`);
        }
    }
};
