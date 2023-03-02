import type * as prettier from "prettier";

export type ClioOptions = {
    file: string
    config: string
    quiet: boolean
    verbose: boolean
}

export type FixLockFileIntegrityConfig = {
    includeFiles?: Array<string>
    includePaths?: Array<string>
    lockFileNames?: Array<string>
    registries?: Array<URL>
    allRegistries?: boolean
    prettier?: prettier.Options
}

export enum FixLockFileResult {
    FILE_NOT_FOUND_ERROR = "FileNotFoundError",
    FILE_WRITE_ERROR = "FileWriteError",
    FILE_PARSE_ERROR = "FileParseError",
    FILE_NOT_CHANGED = "FileNotChanged",
    FILE_FIXED = "FileFixed"
}

export const isError = (result: FixLockFileResult) => {
    return result !== FixLockFileResult.FILE_FIXED && result !== FixLockFileResult.FILE_NOT_CHANGED;
};