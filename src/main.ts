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

/*
enum Mode {
    FILE = "FILE",
    LOOKUP = "LOOKUP"
}
*/

export const main = async () => {
    const cliParams = await yargs(hideBin(process.argv))
        .command<Command>("* [file]", "fix file", (yargs) => {
            return yargs
                .positional("file", {
                    describe: "file to fix"
                });
        }, (argv) => {
            console.log(JSON.stringify(argv, null, 2));
        })
        .option("config", {
            alias: "c",
            type: "string",
            description: "configuration file"
        })
        .parse();

    // todo remove
    console.log(JSON.stringify({ cliParams: { config: cliParams.config, file: cliParams.file } }, null, 2));

    // Read config
    const config: FixLockFileIntegrityConfig = await getConfig(cliParams.config);
    console.log(JSON.stringify({ config }, null, 2));
    
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
        console.log(`Calling await fixLockFile("${lockFile}");`);
        await fixLockFile(lockFile);
    }
};

// Run main
main().catch(console.error);
