import type { FixLockFileIntegrityConfig } from "../src";
import { defaultFixLockFileIntegrityConfig, defaultPrettierOptions, getConfig } from "../src";
import path from "path";

describe("Test config", () => {
    it("Should get default config", async () => {
        const defaultConfig: FixLockFileIntegrityConfig = await getConfig();
        expect(defaultConfig).toEqual({ ...defaultFixLockFileIntegrityConfig, prettier: defaultPrettierOptions });
    });
    
    it("Should merge config from TypeScript file into default config", async () => {
        const defaultConfig: FixLockFileIntegrityConfig = await getConfig(path.resolve(__dirname, "resources", "fix-lockfile.config.ts"));
        expect(defaultConfig).toEqual({
            includePaths: [
                "./",
                "./packages/a",
                "./packages/b"
            ],
            lockFileNames: [
                "package-lock.json"
            ],
            prettier: {
                endOfLine: "cr",
                parser: "json",
                tabWidth: 2,
                useTabs: true
            }
        });
    });

    it("Should merge config from JavaScript file into default config", async () => {
        const defaultConfig: FixLockFileIntegrityConfig = await getConfig(path.resolve(__dirname, "resources", ".fix-lockfile.js"));
        expect(defaultConfig).toEqual({
            includePaths: [
                "./",
                "./packages/a",
                "./packages/b"
            ],
            lockFileNames: [
                "package-lock.json"
            ],
            prettier: {
                endOfLine: "cr",
                parser: "json",
                tabWidth: 2,
                useTabs: true
            }
        });
    });

    it("Should merge config from JSON file into default config", async () => {
        const defaultConfig: FixLockFileIntegrityConfig = await getConfig(path.resolve(__dirname, "resources", ".fix-lockfile.json"));
        expect(defaultConfig).toEqual({
            includePaths: [
                "./",
                "./packages/a",
                "./packages/b"
            ],
            lockFileNames: [
                "package-lock.json"
            ],
            prettier: {
                endOfLine: "cr",
                parser: "json",
                tabWidth: 2,
                useTabs: true
            }
        });
    });

    it("Should merge config from YAML file into default config", async () => {
        const defaultConfig: FixLockFileIntegrityConfig = await getConfig(path.resolve(__dirname, "resources", ".fix-lockfile.yml"));
        expect(defaultConfig).toEqual({
            includePaths: [
                "./",
                "./packages/a",
                "./packages/b"
            ],
            lockFileNames: [
                "package-lock.json"
            ],
            prettier: {
                endOfLine: "cr",
                parser: "json",
                tabWidth: 2,
                useTabs: true
            }
        });
    });
});
