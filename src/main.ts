import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import type { FixLockFileIntegrityConfig } from "./types";
import { getConfig } from "./config";
import { fixLockFile } from "./lockfix";
import path from "path";

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
        .parse();

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

    console.log(`Handling ${lockFilesLocations.length} file${lockFilesLocations.length > 1 ? "s" : ""}`);
    for (let i = 0; i < lockFilesLocations.length; i++) {
        const lockFile = lockFilesLocations[i];
        console.log(`Started handling ${lockFile} [${i+1}/${lockFilesLocations.length}]`);
        try {
            await fixLockFile(lockFile);
        }
        catch (e) {
            // do nothing
        }
        console.log(`Finished handling ${lockFile} [${i+1}/${lockFilesLocations.length}]`);
    }
};

// Run main
main().catch(console.error);
