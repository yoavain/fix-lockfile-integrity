import type { FixLockFileIntegrityConfig } from "./src";

const config: FixLockFileIntegrityConfig = {
    includePaths: ["./"],
    lockFileNames: ["package-lock.json"]
};

export default config;
