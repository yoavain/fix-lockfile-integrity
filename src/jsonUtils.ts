import type * as prettier from "prettier";

const DEFAULT_INDENT_OPTIONS: prettier.Options = {
    tabWidth: 2,
    useTabs: false,
    endOfLine: "auto"
};
    
export const detectJsonStyle = (jsonString: string): prettier.Options => {
    let style = DEFAULT_INDENT_OPTIONS;
    if (typeof jsonString !== "string") {
        return style;
    }

    // Indentation
    if (jsonString !== "{}") {
        const lines = jsonString.split("\n");
        if (lines.length >= 2) {
            const space = lines[1].match(/^(\s*)/);
            if (space[0] === "\t") {
                style.useTabs = true;
                delete style.tabWidth;
            }
            else {
                style.tabWidth = space[0].length;
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

    return style;
};
