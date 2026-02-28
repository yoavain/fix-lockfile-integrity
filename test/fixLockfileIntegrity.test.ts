import fs from "fs";
import { fixLockFile, FixLockFileResult, formHashApiUrl, getIntegrity, logger, parseRegistryWithPath } from "../src";

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

const LOCKFILE_V1_PRIV_REG_SIMPLE_NAME_PACKAGE = {
    i: {
        version: "1.0.0",
        resolved: "https://registry.company.com/private/subpath/i/-/i-1.0.0.tgz",
        integrity: SHA1
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

describe("Test fix lockfile integrity", () => {
    describe("Test registry parsing from resolved field", () => {
        it("Test simple package name", () => {
            let registryPathUrl = parseRegistryWithPath(new URL(LOCKFILE_V1_SIMPLE_PACKAGE.packageName.resolved), "packageName");
            expect(registryPathUrl.toString()).toEqual("https://registry.npmjs.org/");
        });

        it("Test short package name", () => {
            let registryPathUrl = parseRegistryWithPath(new URL(LOCKFILE_V1_PRIV_REG_SIMPLE_NAME_PACKAGE.i.resolved), "i");
            expect(registryPathUrl.toString()).toEqual("https://registry.company.com/private/subpath/");
        });

        it("Should throw when package name is not found in resolved URL", () => {
            expect(() => parseRegistryWithPath(
                new URL("https://registry.npmjs.org/otherPackage/-/otherPackage-1.0.0.tgz"),
                "missingPackage"
            )).toThrow("Package name \"missingPackage\" not found in registry URL");
        });
    });

    describe("Test API URL forming", () => {
        it("Test private NPM registry package", () => {
            let packageName = Object.keys(LOCKFILE_V1_PRIV_REG_SIMPLE_NAME_PACKAGE)[0];
            let registryPathUrl: URL = parseRegistryWithPath(new URL(LOCKFILE_V1_PRIV_REG_SIMPLE_NAME_PACKAGE[packageName].resolved), packageName);
            let apiUrl = formHashApiUrl(registryPathUrl, packageName, LOCKFILE_V1_PRIV_REG_SIMPLE_NAME_PACKAGE[packageName].version);
            expect(apiUrl.toString()).toEqual("https://registry.company.com/private/subpath/i/1.0.0");
        });

        it("Test scoped package", () => {
            let packageName = Object.keys(LOCKFILE_V1_SCOPED_PACKAGE)[0];
            let registryPathUrl: URL = parseRegistryWithPath(new URL(LOCKFILE_V1_SCOPED_PACKAGE[packageName].resolved), packageName);
            let apiUrl = formHashApiUrl(registryPathUrl, packageName, LOCKFILE_V1_SCOPED_PACKAGE[packageName].version);
            expect(apiUrl.toString()).toEqual("https://registry.npmjs.org/@scopeName/packageName/1.0.0");
        });
    });

    describe("Test error handling hitting hash API", () => {
        const packageName = Object.keys(LOCKFILE_V1_SIMPLE_PACKAGE)[0];
        const registry: URL = parseRegistryWithPath(new URL(LOCKFILE_V1_SIMPLE_PACKAGE[packageName].resolved), packageName);
        const packageVersion = LOCKFILE_V1_SIMPLE_PACKAGE[packageName].version;

        it("should log warning when error retrieving response from API", async () => {
            const mockedError = new Error("Error message");
            jest.spyOn(global, "fetch").mockRejectedValue(mockedError);
            jest.spyOn(logger, "warn").mockImplementation(() => {});

            const result = await getIntegrity(registry, packageName, packageVersion);

            expect(result).toBeUndefined();
            expect(logger.warn).toHaveBeenCalledTimes(1);
        });

        it("should log warning when unable to retrieve sha512 from API response", async () => {
            jest.spyOn(global, "fetch").mockResolvedValue({
                status: 200,
                json: jest.fn().mockResolvedValue({ dist: { integrity: "sha1-abc" } })
            } as unknown as Response);
            jest.spyOn(logger, "warn").mockImplementation(() => {});

            const result = await getIntegrity(registry, packageName, packageVersion);

            expect(result).toBeUndefined();
            expect(logger.warn).toHaveBeenCalledTimes(1);
        });

        it("should return undefined and log warning when API returns 404", async () => {
            jest.spyOn(global, "fetch").mockResolvedValue({
                status: 404,
                json: jest.fn().mockResolvedValue({})
            } as unknown as Response);
            jest.spyOn(logger, "warn").mockImplementation(() => {});

            const result = await getIntegrity(registry, packageName, packageVersion);

            expect(result).toBeUndefined();
            expect(logger.warn).toHaveBeenCalledTimes(1);
        });

        it("should return undefined and log warning when API response JSON cannot be parsed", async () => {
            jest.spyOn(global, "fetch").mockResolvedValue({
                status: 200,
                json: jest.fn().mockRejectedValue(new Error("JSON parse error"))
            } as unknown as Response);
            jest.spyOn(logger, "warn").mockImplementation(() => {});

            const result = await getIntegrity(registry, packageName, packageVersion);

            expect(result).toBeUndefined();
            expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("Unable to parse JSON"));
        });
    });

    describe("Test fixLockFile", () => {
        beforeEach(() => {
            jest.spyOn(global, "fetch").mockResolvedValue({
                status: 200,
                json: jest.fn().mockResolvedValue({ dist: { integrity: SHA512 } })
            } as unknown as Response);

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
            expect(global.fetch).toHaveBeenCalledTimes(1);
            const expectedJsonString = jsonString.replace(SHA1, SHA512);
            expect(fsPromises.writeFile).toHaveBeenCalledWith("fileLocation", expectedJsonString, "utf8");
        });

        it("Should handle lock file version 1 - scoped package", async () => {
            const jsonString = JSON.stringify(LOCKFILE_V1_SCOPED_PACKAGE, null, 2) + "\n";
            jest.spyOn(fsPromises, "readFile").mockResolvedValue(jsonString);
            jest.spyOn(fsPromises, "writeFile").mockImplementation(async () => {});

            const result: FixLockFileResult = await fixLockFile("fileLocation");

            expect(result).toEqual(FixLockFileResult.FILE_FIXED);
            expect(global.fetch).toHaveBeenCalledTimes(1);
            const expectedJsonString = jsonString.replace(SHA1, SHA512);
            expect(fsPromises.writeFile).toHaveBeenCalledWith("fileLocation", expectedJsonString, "utf8");
        });

        it("Should handle lock file version 2 - simple package", async () => {
            const jsonString = JSON.stringify(LOCKFILE_V2_SIMPLE_PACKAGE, null, 2) + "\n";
            jest.spyOn(fsPromises, "readFile").mockResolvedValue(jsonString);
            jest.spyOn(fsPromises, "writeFile").mockImplementation(async () => {});

            const result: FixLockFileResult = await fixLockFile("fileLocation");

            expect(result).toEqual(FixLockFileResult.FILE_FIXED);
            expect(global.fetch).toHaveBeenCalledTimes(1);
            const expectedJsonString = jsonString.replace(SHA1, SHA512);
            expect(fsPromises.writeFile).toHaveBeenCalledWith("fileLocation", expectedJsonString, "utf8");
        });

        it("Should handle lock file version 2 - scoped package", async () => {
            const jsonString = JSON.stringify(LOCKFILE_V2_SCOPED_PACKAGE, null, 2) + "\n";
            jest.spyOn(fsPromises, "readFile").mockResolvedValue(jsonString);
            jest.spyOn(fsPromises, "writeFile").mockImplementation(async () => {});

            const result: FixLockFileResult = await fixLockFile("fileLocation");

            expect(result).toEqual(FixLockFileResult.FILE_FIXED);
            expect(global.fetch).toHaveBeenCalledTimes(1);
            const expectedJsonString = jsonString.replace(SHA1, SHA512);
            expect(fsPromises.writeFile).toHaveBeenCalledWith("fileLocation", expectedJsonString, "utf8");
        });

        it("Should not change lock file when not needed", async () => {
            const jsonString = JSON.stringify(LOCKFILE_V1_SIMPLE_PACKAGE, null, 2).replace(SHA1, SHA512) + "\n";
            jest.spyOn(fsPromises, "readFile").mockResolvedValue(jsonString);

            const result: FixLockFileResult = await fixLockFile("fileLocation");

            expect(result).toEqual(FixLockFileResult.FILE_NOT_CHANGED);
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it("Should warn and skip node with invalid resolved URL", async () => {
            const lockfileWithInvalidUrl = {
                packageName: {
                    version: "1.0.0",
                    resolved: "not-a-url",
                    integrity: SHA1
                }
            };
            const jsonString = JSON.stringify(lockfileWithInvalidUrl, null, 2) + "\n";
            jest.spyOn(fsPromises, "readFile").mockResolvedValue(jsonString);

            const result: FixLockFileResult = await fixLockFile("fileLocation");

            expect(result).toEqual(FixLockFileResult.FILE_NOT_CHANGED);
            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("is not a valid URL"));
        });

        it("Should not share cache between calls (cache isolation)", async () => {
            // First call: SHA1 → SHA512
            const jsonString1 = JSON.stringify(LOCKFILE_V1_SIMPLE_PACKAGE, null, 2) + "\n";
            jest.spyOn(fsPromises, "readFile").mockResolvedValueOnce(jsonString1);
            jest.spyOn(fsPromises, "writeFile").mockImplementation(async () => {});
            await fixLockFile("fileLocation");

            // Second call: already SHA512, no change expected
            const jsonString2 = JSON.stringify(LOCKFILE_V1_SIMPLE_PACKAGE, null, 2).replace(SHA1, SHA512) + "\n";
            jest.spyOn(fsPromises, "readFile").mockResolvedValueOnce(jsonString2);
            const result = await fixLockFile("fileLocation");

            expect(result).toEqual(FixLockFileResult.FILE_NOT_CHANGED);
        });

        it("Should fetch same package/version only once", async () => {
            const jsonString = JSON.stringify({ ...LOCKFILE_V1_SIMPLE_PACKAGE, ...LOCKFILE_V2_SIMPLE_PACKAGE }, null, 2) + "\n";
            jest.spyOn(fsPromises, "readFile").mockResolvedValue(jsonString);
            jest.spyOn(fsPromises, "writeFile").mockImplementation(async () => {});

            const result: FixLockFileResult = await fixLockFile("fileLocation");

            expect(result).toEqual(FixLockFileResult.FILE_FIXED);
            expect(global.fetch).toHaveBeenCalledTimes(1);
            const expectedJsonString = jsonString.replace(new RegExp(SHA1, "g"), SHA512);
            expect(fsPromises.writeFile).toHaveBeenCalledWith("fileLocation", expectedJsonString, "utf8");
        });
    });
});
