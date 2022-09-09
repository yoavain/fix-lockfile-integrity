import type { FixLockFileIntegrityConfig } from "../../src";

const config: FixLockFileIntegrityConfig = {
    includePaths: ["./", "./packages/a", "./packages/b"],
    lockFileNames: ["package-lock.json"],
    prettier: {
        useTabs: true,
        endOfLine: "cr"
    }
};

export default config;
