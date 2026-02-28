import * as cli from "../src/cli";
import * as fixLockfileIntegrity from "../src/fixLockfileIntegrity";
import { FixLockFileResult, main } from "../src";
import * as config from "../src/config";

describe("Test main logic", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("Test explicit file flow", async () => {
        jest.spyOn(cli, "parseCliOptions").mockReturnValue({
            file: "explicitFile",
            config: undefined,
            quiet: true,
            verbose: false
        });
        jest.spyOn(fixLockfileIntegrity, "fixLockFile").mockImplementation(async () => FixLockFileResult.FILE_NOT_CHANGED);

        await main();

        expect(fixLockfileIntegrity.fixLockFile).toHaveBeenCalledWith("explicitFile");
    });

    it("Test multiple explicit files via config", async () => {
        jest.spyOn(cli, "parseCliOptions").mockReturnValue({
            file: undefined,
            config: undefined,
            quiet: false,
            verbose: true
        });
        jest.spyOn(config, "getConfig").mockResolvedValue({
            includeFiles: ["explicitFile1", "explicitFile2"]
        });
        jest.spyOn(fixLockfileIntegrity, "fixLockFile").mockImplementation(async () => FixLockFileResult.FILE_NOT_CHANGED);

        await main();

        expect(fixLockfileIntegrity.fixLockFile).toHaveBeenCalledTimes(2);
    });

    it("Test explicit file flow - error", async () => {
        jest.spyOn(cli, "parseCliOptions").mockReturnValue({
            file: "explicitFile",
            config: undefined,
            quiet: false,
            verbose: false
        });
        jest.spyOn(fixLockfileIntegrity, "fixLockFile").mockImplementation(async () => FixLockFileResult.FILE_NOT_FOUND_ERROR);

        try {
            await main();
            fail();
        }
        catch (e) {
            expect(fixLockfileIntegrity.fixLockFile).toHaveBeenCalledWith("explicitFile");
        }
    });

    it("Test lookup paths flow", async () => {
        jest.spyOn(cli, "parseCliOptions").mockReturnValue({
            file: undefined,
            config: undefined,
            quiet: false,
            verbose: false
        });
        jest.spyOn(fixLockfileIntegrity, "fixLockFile").mockImplementation(async () => FixLockFileResult.FILE_NOT_CHANGED);

        await main();

        expect(fixLockfileIntegrity.fixLockFile).toHaveBeenCalledTimes(2);
    });

    it("Test separator between multiple lookup paths", async () => {
        jest.spyOn(cli, "parseCliOptions").mockReturnValue({
            file: undefined,
            config: undefined,
            quiet: false,
            verbose: true
        });
        jest.spyOn(config, "getConfig").mockResolvedValue({
            includePaths: ["path1", "path2"],
            lockFileNames: ["package-lock.json"]
        });
        jest.spyOn(fixLockfileIntegrity, "fixLockFile").mockImplementation(async () => FixLockFileResult.FILE_NOT_CHANGED);

        await main();

        expect(fixLockfileIntegrity.fixLockFile).toHaveBeenCalledTimes(2);
    });

    it("Test lookup paths flow - all errors", async () => {
        jest.spyOn(cli, "parseCliOptions").mockReturnValue({
            file: undefined,
            config: undefined,
            quiet: false,
            verbose: false
        });
        jest.spyOn(fixLockfileIntegrity, "fixLockFile").mockImplementation(async () => FixLockFileResult.FILE_NOT_FOUND_ERROR);

        try {
            await main();
            fail();
        }
        catch (e) {
            expect(fixLockfileIntegrity.fixLockFile).toHaveBeenCalledTimes(2);
        }
    });
});