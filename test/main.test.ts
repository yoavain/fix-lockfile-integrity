import * as cli from "../src/cli";
import * as fixLockfileIntegrity from "../src/fixLockfileIntegrity";
import { FixLockFileResult, main } from "../src";
import * as config from "../src/config";
import * as workspaces from "../src/workspaces";
import path from "path";

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

    it("Test workspace paths are added to lookup paths", async () => {
        jest.spyOn(cli, "parseCliOptions").mockReturnValue({
            file: undefined,
            config: undefined,
            quiet: false,
            verbose: true
        });
        jest.spyOn(config, "getConfig").mockResolvedValue({
            includePaths: ["./"],
            lockFileNames: ["package-lock.json"]
        });
        jest.spyOn(workspaces, "getWorkspacePaths").mockReturnValue(["./packages/a"]);
        jest.spyOn(fixLockfileIntegrity, "fixLockFile").mockImplementation(async () => FixLockFileResult.FILE_NOT_CHANGED);

        await main();

        expect(workspaces.getWorkspacePaths).toHaveBeenCalledWith(path.resolve("./"), ["package-lock.json"]);
        expect(fixLockfileIntegrity.fixLockFile).toHaveBeenCalledTimes(2);
        expect(fixLockfileIntegrity.fixLockFile).toHaveBeenCalledWith(path.resolve("./", "package-lock.json"));
        expect(fixLockfileIntegrity.fixLockFile).toHaveBeenCalledWith(path.resolve("./packages/a", "package-lock.json"));
    });

    it("Test workspace path already in include paths is not handled twice", async () => {
        jest.spyOn(cli, "parseCliOptions").mockReturnValue({
            file: undefined,
            config: undefined,
            quiet: false,
            verbose: false
        });
        jest.spyOn(config, "getConfig").mockResolvedValue({
            includePaths: ["./packages/a"],
            lockFileNames: ["package-lock.json"]
        });
        jest.spyOn(workspaces, "getWorkspacePaths").mockReturnValue(["./packages/a"]);
        jest.spyOn(fixLockfileIntegrity, "fixLockFile").mockImplementation(async () => FixLockFileResult.FILE_NOT_CHANGED);

        await main();

        expect(fixLockfileIntegrity.fixLockFile).toHaveBeenCalledTimes(1);
    });

    it("Test workspace detection is skipped when includeWorkspaces is false", async () => {
        jest.spyOn(cli, "parseCliOptions").mockReturnValue({
            file: undefined,
            config: undefined,
            quiet: false,
            verbose: false
        });
        jest.spyOn(config, "getConfig").mockResolvedValue({
            includePaths: ["./"],
            includeWorkspaces: false,
            lockFileNames: ["package-lock.json"]
        });
        jest.spyOn(workspaces, "getWorkspacePaths").mockReturnValue(["./packages/a"]);
        jest.spyOn(fixLockfileIntegrity, "fixLockFile").mockImplementation(async () => FixLockFileResult.FILE_NOT_CHANGED);

        await main();

        expect(workspaces.getWorkspacePaths).not.toHaveBeenCalled();
        expect(fixLockfileIntegrity.fixLockFile).toHaveBeenCalledTimes(1);
    });

    it("Test workspace detection is skipped on --disable-workspaces", async () => {
        jest.spyOn(cli, "parseCliOptions").mockReturnValue({
            file: undefined,
            config: undefined,
            quiet: false,
            verbose: false,
            disableWorkspaces: true
        });
        jest.spyOn(config, "getConfig").mockResolvedValue({
            includePaths: ["./"],
            lockFileNames: ["package-lock.json"]
        });
        jest.spyOn(workspaces, "getWorkspacePaths").mockReturnValue(["./packages/a"]);
        jest.spyOn(fixLockfileIntegrity, "fixLockFile").mockImplementation(async () => FixLockFileResult.FILE_NOT_CHANGED);

        await main();

        expect(workspaces.getWorkspacePaths).not.toHaveBeenCalled();
        expect(fixLockfileIntegrity.fixLockFile).toHaveBeenCalledTimes(1);
    });

    it("Test workspace detection is skipped for an explicit file", async () => {
        jest.spyOn(cli, "parseCliOptions").mockReturnValue({
            file: "explicitFile",
            config: undefined,
            quiet: false,
            verbose: false
        });
        jest.spyOn(workspaces, "getWorkspacePaths").mockReturnValue(["./packages/a"]);
        jest.spyOn(fixLockfileIntegrity, "fixLockFile").mockImplementation(async () => FixLockFileResult.FILE_NOT_CHANGED);

        await main();

        expect(workspaces.getWorkspacePaths).not.toHaveBeenCalled();
        expect(fixLockfileIntegrity.fixLockFile).toHaveBeenCalledWith("explicitFile");
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