import type { CliOptions } from "./types";

const HELP_TEXT = `Usage: fix-lockfile [options] [file]

Fix lock file integrity

Positionals:
  file  file to fix (default: looks for package-lock.json/npm-shrinkwrap.json in running folder)

Options:
  -c, --config   configuration file                 [string]
  -v, --verbose  verbose logging                    [boolean]
  -q, --quiet    quiet (suppresses verbose too)     [boolean]
  -h, --help     Show help                          [boolean]

Examples:
  fix-lockfile --config fix-lockfile.config.json package-lock.json
  fix-lockfile --quiet

Created by Yoav Vainrich at https://github.com/yoavain/fix-lockfile-integrity`;

export const parseCliOptions = (): CliOptions => {
    const args = process.argv.slice(2);
    const result: CliOptions = { quiet: false, verbose: false };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "-h" || arg === "--help") {
            process.stdout.write(HELP_TEXT + "\n");
            process.exit(0);
        }
        else if (arg === "-v" || arg === "--verbose") {
            result.verbose = true;
        }
        else if (arg === "-q" || arg === "--quiet") {
            result.quiet = true;
        }
        else if (arg === "-c" || arg === "--config") {
            result.config = args[++i];
        }
        else if (!arg.startsWith("-")) {
            result.file = arg;
        }
    }

    return result;
};
