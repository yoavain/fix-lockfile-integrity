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

    for (const lockFile of lockFilesLocations) {
        console.log(`Started handling ${lockFile}`);
        try {
            await fixLockFile(lockFile);
        }
        catch (e) {
            // do nothing
        }
        console.log(`Finished handling ${lockFile}`);
    }
};

// Run main
main().catch(console.error);
