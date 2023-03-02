import fs from "fs";
import got from "got";
import { fixLockFile, FixLockFileResult, parseRegistryWithPath } from "../src";

const fsPromises = fs.promises;

const SHA512: string = "sha512-longHash";
const SHA1: string = "sha1-shortHash";

const LOCKFILE_V1_SIMPLE_PACKAGE = {
    packageName: {
        version: "1.0.0",
        resolved: "https://registry.npmjs.org/packageName/-/packageName-1.0.0.tgz",
        integrity: SHA1,
        engines: {
            node: "^14.15.0 || >=16.0.0"
        },
        os: [
            "darwin"
        ]
    }
};
const LOCKFILE_V1_SCOPED_PACKAGE = {
    "@scopeName/packageName": {
        version: "1.0.0",
        resolved: "https://registry.npmjs.org/@scopeName/packageName/-/packageName-1.0.0.tgz",
        integrity: SHA1
    }
};

const LOCKFILE_V2_SIMPLE_PACKAGE = {
    "node_modules/packageName": {
        version: "1.0.0",
        resolved: "https://registry.npmjs.org/packageName/-/packageName-1.0.0.tgz",
        integrity: SHA1
    }
};
const LOCKFILE_V2_SCOPED_PACKAGE = {
    "node_modules/@scopeName/packageName": {
        version: "1.0.0",
        resolved: "https://registry.npmjs.org/@scopeName/packageName/-/packageName-1.0.0.tgz",
        integrity: SHA1
    }
};

const SIMPLE_NAME_PACKAGE_RESOLVED = "https://registry.company.com/private/i/-/i-1.0.0.tgz";

describe("Test fix lockfile integrity", () => {
    describe("Test registry parsing from resolved field", () => {
        it("Test simple package name", () => {
            expect(parseRegistryWithPath(new URL(LOCKFILE_V1_SIMPLE_PACKAGE.packageName.resolved), "packageName").toString()).toEqual(new URL("https://registry.npmjs.org").toString());
        });

        it("Test short package name", () => {
            expect(parseRegistryWithPath(new URL(SIMPLE_NAME_PACKAGE_RESOLVED), "i").toString()).toEqual(new URL("https://registry.company.com/private").toString());
        });
    });

    describe("Test fixLockFile", () => {
        beforeEach(() => {
            jest.spyOn(got, "get").mockResolvedValue({ body: { dist: { integrity: SHA512 } } });

            jest.spyOn(console, "info").mockImplementation(() => {});
            jest.spyOn(console, "error").mockImplementation(() => {});
            jest.spyOn(console, "warn").mockImplementation(() => {});
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("Test fixLockFile - file not found", async () => {
            jest.spyOn(fsPromises, "readFile").mockImplementation(() => {
                throw new Error("File not found");
            });

            const result: FixLockFileResult = await fixLockFile("fileLocation");

            expect(result).toEqual(FixLockFileResult.FILE_NOT_FOUND_ERROR);
        });

        it("Test fixLockFile - empty file - file parse error", async () => {
            jest.spyOn(fsPromises, "readFile").mockResolvedValue("");

            const result: FixLockFileResult = await fixLockFile("fileLocation");

            expect(result).toEqual(FixLockFileResult.FILE_PARSE_ERROR);
        });

        it("Test fixLockFile - corrupt json - file parse error", async () => {
            jest.spyOn(fsPromises, "readFile").mockResolvedValue("{ AAA }");

            const result: FixLockFileResult = await fixLockFile("fileLocation");

            expect(result).toEqual(FixLockFileResult.FILE_PARSE_ERROR);
        });

        it("Test fixLockFile - file write error", async () => {
            const jsonString = JSON.stringify(LOCKFILE_V1_SIMPLE_PACKAGE, null, 2) + "\n";
            jest.spyOn(fsPromises, "readFile").mockResolvedValue(jsonString);
            jest.spyOn(fsPromises, "writeFile").mockImplementation(async () => {
                throw new Error("File write error");
            });

            const result: FixLockFileResult = await fixLockFile("fileLocation");

            expect(result).toEqual(FixLockFileResult.FILE_WRITE_ERROR);
        });

        it("Should handle lock file version 1 - simple package", async () => {
            const jsonString = JSON.stringify(LOCKFILE_V1_SIMPLE_PACKAGE, null, 2) + "\n";
            jest.spyOn(fsPromises, "readFile").mockResolvedValue(jsonString);
            jest.spyOn(fsPromises, "writeFile").mockImplementation(async () => {});

            const result: FixLockFileResult = await fixLockFile("fileLocation");

            expect(result).toEqual(FixLockFileResult.FILE_FIXED);
            expect(got.get).toHaveBeenCalledTimes(1);
            const expectedJsonString = jsonString.replace(SHA1, SHA512);
            expect(fsPromises.writeFile).toHaveBeenCalledWith("fileLocation", expectedJsonString, "utf8");
        });

        it("Should handle lock file version 1 - scoped package", async () => {
            const jsonString = JSON.stringify(LOCKFILE_V1_SCOPED_PACKAGE, null, 2) + "\n";
            jest.spyOn(fsPromises, "readFile").mockResolvedValue(jsonString);
            jest.spyOn(fsPromises, "writeFile").mockImplementation(async () => {});

            const result: FixLockFileResult = await fixLockFile("fileLocation");

            expect(result).toEqual(FixLockFileResult.FILE_FIXED);
            expect(got.get).toHaveBeenCalledTimes(1);
            const expectedJsonString = jsonString.replace(SHA1, SHA512);
            expect(fsPromises.writeFile).toHaveBeenCalledWith("fileLocation", expectedJsonString, "utf8");
        });

        it("Should handle lock file version 2 - simple package", async () => {
            const jsonString = JSON.stringify(LOCKFILE_V2_SIMPLE_PACKAGE, null, 2) + "\n";
            jest.spyOn(fsPromises, "readFile").mockResolvedValue(jsonString);
            jest.spyOn(fsPromises, "writeFile").mockImplementation(async () => {});

            const result: FixLockFileResult = await fixLockFile("fileLocation");

            expect(result).toEqual(FixLockFileResult.FILE_FIXED);
            expect(got.get).toHaveBeenCalledTimes(1);
            const expectedJsonString = jsonString.replace(SHA1, SHA512);
            expect(fsPromises.writeFile).toHaveBeenCalledWith("fileLocation", expectedJsonString, "utf8");
        });

        it("Should handle lock file version 2 - scoped package", async () => {
            const jsonString = JSON.stringify(LOCKFILE_V2_SCOPED_PACKAGE, null, 2) + "\n";
            jest.spyOn(fsPromises, "readFile").mockResolvedValue(jsonString);
            jest.spyOn(fsPromises, "writeFile").mockImplementation(async () => {});

            const result: FixLockFileResult = await fixLockFile("fileLocation");

            expect(result).toEqual(FixLockFileResult.FILE_FIXED);
            expect(got.get).toHaveBeenCalledTimes(1);
            const expectedJsonString = jsonString.replace(SHA1, SHA512);
            expect(fsPromises.writeFile).toHaveBeenCalledWith("fileLocation", expectedJsonString, "utf8");
        });

        it("Should not change lock file when not needed", async () => {
            const jsonString = JSON.stringify(LOCKFILE_V1_SIMPLE_PACKAGE, null, 2).replace(SHA1, SHA512) + "\n";
            jest.spyOn(fsPromises, "readFile").mockResolvedValue(jsonString);

            const result: FixLockFileResult = await fixLockFile("fileLocation");

            expect(result).toEqual(FixLockFileResult.FILE_NOT_CHANGED);
            expect(got.get).not.toHaveBeenCalled();
        });

        it("Should fetch same package/version only once", async () => {
            const jsonString = JSON.stringify({ ...LOCKFILE_V1_SIMPLE_PACKAGE, ...LOCKFILE_V2_SIMPLE_PACKAGE }, null, 2) + "\n";
            jest.spyOn(fsPromises, "readFile").mockResolvedValue(jsonString);
            jest.spyOn(fsPromises, "writeFile").mockImplementation(async () => {});

            const result: FixLockFileResult = await fixLockFile("fileLocation");

            expect(result).toEqual(FixLockFileResult.FILE_FIXED);
            expect(got.get).toHaveBeenCalledTimes(1);
            const expectedJsonString = jsonString.replace(new RegExp(SHA1, "g"), SHA512);
            expect(fsPromises.writeFile).toHaveBeenCalledWith("fileLocation", expectedJsonString, "utf8");
        });
    });
});
