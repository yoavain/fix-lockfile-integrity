import type * as prettier from "prettier";

export type FixLockFileIntegrityConfig = {
    prettier?: prettier.Options
    includePaths?: Array<string>
    lockFileNames?: Array<string>
    includeFiles?: Array<string>
}
