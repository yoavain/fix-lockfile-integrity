import type { CliOptions } from "./types";
import { parseArgs } from "util";

const HELP_TEXT = `Usage: fix-lockfile [options] [file]

Fix lock file integrity

Positionals:
  file  file to fix (default: looks for package-lock.json/npm-shrinkwrap.json in running folder)

Options:
  -c, --config              configuration file                [string]
  -v, --verbose             verbose logging                   [boolean]
  -q, --quiet               quiet (suppresses verbose too)    [boolean]
      --disable-workspaces  do not detect workspace folders   [boolean]
  -h, --help                Show help                         [boolean]

Examples:
  fix-lockfile --config fix-lockfile.config.json package-lock.json
  fix-lockfile --quiet

Created by Yoav Vainrich at https://github.com/yoavain/fix-lockfile-integrity`;

const HELP_HINT = "Run fix-lockfile --help to see the available options";

const parse = (args: string[]) => {
    try {
        return parseArgs({
            args,
            options: {
                "config": { type: "string", short: "c" },
                "verbose": { type: "boolean", short: "v" },
                "quiet": { type: "boolean", short: "q" },
                "disable-workspaces": { type: "boolean" },
                "help": { type: "boolean", short: "h" }
            },
            strict: true,
            allowPositionals: true
        });
    }
    catch (e) {
        // parseArgs throws a TypeError with an ERR_PARSE_ARGS_* code
        throw new Error(`${(e as Error).message}\n${HELP_HINT}`);
    }
};

export const parseCliOptions = (): CliOptions => {
    const { values, positionals } = parse(process.argv.slice(2));

    if (values.help) {
        process.stdout.write(HELP_TEXT + "\n");
        process.exit(0);
    }

    if (positionals.length > 1) {
        throw new Error(`Expected a single file to fix, but got ${positionals.length}: ${positionals.join(", ")}\n${HELP_HINT}`);
    }

    return {
        file: positionals[0],
        config: values.config,
        quiet: Boolean(values.quiet),
        verbose: Boolean(values.verbose),
        disableWorkspaces: Boolean(values["disable-workspaces"])
    };
};
