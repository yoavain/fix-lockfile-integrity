import * as cli from "../src/cli";
import * as fixLockfileIntegrity from "../src/fixLockfileIntegrity";
import { FixLockFileResult, main } from "../src";

describe("Test main logic", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("Test explicit file flow", async () => {
        jest.spyOn(cli, "parseCliOptions").mockResolvedValue({
            file: "explicitFile",
            config: undefined,
            quiet: true,
            verbose: false
        });
        jest.spyOn(fixLockfileIntegrity, "fixLockFile").mockImplementation(async () => FixLockFileResult.FILE_NOT_CHANGED);

        await main();

        expect(fixLockfileIntegrity.fixLockFile).toHaveBeenCalledWith("explicitFile");
    });

    it("Test explicit file flow - error", async () => {
        jest.spyOn(cli, "parseCliOptions").mockResolvedValue({
            file: "explicitFile",
            config: undefined,
            quiet: true,
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
        jest.spyOn(cli, "parseCliOptions").mockResolvedValue({
            file: undefined,
            config: undefined,
            quiet: true,
            verbose: false
        });
        jest.spyOn(fixLockfileIntegrity, "fixLockFile").mockImplementation(async () => FixLockFileResult.FILE_NOT_CHANGED);

        await main();

        expect(fixLockfileIntegrity.fixLockFile).toHaveBeenCalledTimes(2);
    });

    it("Test lookup paths flow - all errors", async () => {
        jest.spyOn(cli, "parseCliOptions").mockResolvedValue({
            file: undefined,
            config: undefined,
            quiet: true,
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