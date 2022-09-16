import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import type { ClioOptions } from "./types";

export const parseCliOptions = async (): Promise<ClioOptions> => {
    return yargs(hideBin(process.argv))
        .scriptName("fix-lockfile")
        .command<ClioOptions>("* [file]", "Fix lock file integrity", (yargs) => {
            return yargs
                .positional("file", {
                    describe: "file to fix (default: looks for package-lock.json/npm-shrinkwrap.json in running folder)"
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
        .example("*", "fix-lockfile --config fix-lockfile.config.json package-lock.json")
        .example("*", "fix-lockfile --quiet")
        .epilogue("Created by Yoav Vainrich at https://github.com/yoavain/fix-lockfile-integrity")
        .help("h")
        .alias("h", "help")
        .parse();
};