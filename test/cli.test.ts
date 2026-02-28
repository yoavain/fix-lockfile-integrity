import type { CliOptions } from "../src";
import { parseCliOptions } from "../src";

describe("Test cli", () => {
    let originalArgv;
    beforeEach(() => {
        originalArgv = process.argv;
        // @ts-ignore
        jest.spyOn(process, "exit").mockImplementation((code: number) => {
            expect(code).toEqual(0);
        });
    });
    afterEach(() => {
        jest.restoreAllMocks();
        process.argv = originalArgv;
    });
    
    it("Should work with no args", () => {
        process.argv = [
            "node",
            "cli.js"
        ];

        const cliOptions: CliOptions = parseCliOptions();

        expect(cliOptions.file).toBeUndefined();
        expect(cliOptions.config).toBeUndefined();
        expect(cliOptions.quiet).toBeFalsy();
        expect(cliOptions.verbose).toBeFalsy();
    });

    it("Should parse file", () => {
        process.argv = [
            "node",
            "cli.js",
            "lockFileLocation"
        ];

        const cliOptions: CliOptions = parseCliOptions();

        expect(cliOptions.file).toEqual("lockFileLocation");
        expect(cliOptions.config).toBeUndefined();
        expect(cliOptions.quiet).toBeFalsy();
        expect(cliOptions.verbose).toBeFalsy();
    });

    it("Should parse config", () => {
        process.argv = [
            "node",
            "cli.js",
            "--config",
            "configFileLocation",
            "lockFileLocation"
        ];

        const cliOptions: CliOptions = parseCliOptions();

        expect(cliOptions.file).toEqual("lockFileLocation");
        expect(cliOptions.config).toEqual("configFileLocation");
        expect(cliOptions.quiet).toBeFalsy();
        expect(cliOptions.verbose).toBeFalsy();
    });

    it("Should parse quiet", () => {
        process.argv = [
            "node",
            "cli.js",
            "--quiet"
        ];

        const cliOptions: CliOptions = parseCliOptions();

        expect(cliOptions.file).toBeUndefined();
        expect(cliOptions.config).toBeUndefined();
        expect(cliOptions.quiet).toBeTruthy();
        expect(cliOptions.verbose).toBeFalsy();
    });

    it("Should parse verbose", () => {
        process.argv = [
            "node",
            "cli.js",
            "--verbose"
        ];

        const cliOptions: CliOptions = parseCliOptions();

        expect(cliOptions.file).toBeUndefined();
        expect(cliOptions.config).toBeUndefined();
        expect(cliOptions.quiet).toBeFalsy();
        expect(cliOptions.verbose).toBeTruthy();
    });

    it("Should parse verbose short flag", () => {
        process.argv = ["node", "cli.js", "-v"];

        const cliOptions: CliOptions = parseCliOptions();

        expect(cliOptions.verbose).toBeTruthy();
        expect(cliOptions.quiet).toBeFalsy();
    });

    it("Should parse quiet short flag", () => {
        process.argv = ["node", "cli.js", "-q"];

        const cliOptions: CliOptions = parseCliOptions();

        expect(cliOptions.quiet).toBeTruthy();
        expect(cliOptions.verbose).toBeFalsy();
    });

    it("Should parse config short flag", () => {
        process.argv = ["node", "cli.js", "-c", "configFileLocation"];

        const cliOptions: CliOptions = parseCliOptions();

        expect(cliOptions.config).toEqual("configFileLocation");
    });

    it("Should call process.exit on help short flag", () => {
        process.argv = ["node", "cli.js", "-h"];

        parseCliOptions();

        expect(process.exit).toHaveBeenCalledWith(0);
    });
});
