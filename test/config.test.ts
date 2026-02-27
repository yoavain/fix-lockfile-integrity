import type { FixLockFileIntegrityConfig } from "../src";
import { defaultFixLockFileIntegrityConfig, defaultPrettierOptions, getConfig, setVerbose } from "../src";
import path from "path";

describe("Test config", () => {
    beforeEach(() => {
        jest.spyOn(console, "info").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
        jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

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

    it("Should parse registries correctly and warn on invalid URL in config", async () => {
        setVerbose(true);

        const defaultConfig: FixLockFileIntegrityConfig = await getConfig(path.resolve(__dirname, "resources", ".fix-lockfile-invalid-url.json"));

        expect(defaultConfig).toEqual({
            includePaths: [
                "./",
                "./packages/a",
                "./packages/b"
            ],
            lockFileNames: [
                "package-lock.json"
            ],
            registries: [
                new URL("https://www.goodurl.com")
            ],
            prettier: {
                endOfLine: "cr",
                parser: "json",
                tabWidth: 2,
                useTabs: true
            }
        });
        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledWith("Invalid registry URL in configuration: invalid[::]Url");
    });
});
