import type * as prettier from "prettier";
import type { FixLockFileIntegrityConfig } from "./types";

const LOCK_FILE_NAMES = ["package-lock.json", "npm-shrinkwrap.json"];

export const defaultPrettierOptions: prettier.Options = {
    parser: "json",
    tabWidth: 2,
    useTabs: false,
    endOfLine: "auto"
};

export const defaultFixLockFileIntegrityConfig: FixLockFileIntegrityConfig = {
    includePaths: [__dirname],
    lockFileNames: LOCK_FILE_NAMES
};
