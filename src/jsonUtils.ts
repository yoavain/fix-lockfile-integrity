import type * as prettier from "prettier";
import { logger } from "./logger";
import chalk from "chalk";

const DEFAULT_INDENT_OPTIONS: prettier.Options = {
    tabWidth: 2,
    useTabs: false,
    endOfLine: "auto"
};
    
export const detectJsonStyle = (jsonString: string): prettier.Options => {
    let style = DEFAULT_INDENT_OPTIONS;

    // Indentation
    if (jsonString !== "{}") {
        const lines = jsonString.split("\n");
        if (lines.length >= 2) {
            const space = lines[1].match(/^(\s*)/);
            if (space[0] === "\t") {
                style.useTabs = true;
                delete style.tabWidth;
                logger.verbose(`Detected ${chalk.blue("Tab")} indentation`);
            }
            else {
                style.tabWidth = space[0].length;
                logger.verbose(`Detected ${chalk.blue(style.tabWidth + " spaces")} indentation`);
            }
        }
    }

    // EOL
    const newlines = jsonString.match(/(?:\r?\n)/g) || [];
    if (newlines.length !== 0) {
        const crlf = newlines.filter((newline) => newline === "\r\n").length;
        const lf = newlines.length - crlf;

        if (crlf > lf) {
            style.endOfLine = "crlf";
        }
        else {
            style.endOfLine = "lf";
        }
    }

    logger.verbose(`Detected ${chalk.blue(style.endOfLine)} EOL`);
    return style;
};
